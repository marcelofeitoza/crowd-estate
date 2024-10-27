import { z } from "zod";
import {
	getInvestment,
	getInvestmentsByInvestor,
	getProperties,
} from "../../services/crowd-estate";
import { supabase } from "../../services/supabase";
import { RedisKeyTemplates, redis, RedisKeys } from "../../services/redis";

const createInvestmentSchema = z.object({
	investorPublicKey: z.string().min(32),
	propertyPda: z.string().min(32),
	investmentPda: z.string().min(32),
	txSignature: z.string().min(64),
});

export const handleCreateInvestment = async (body: any) => {
	const parseResult = createInvestmentSchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}

	const { investorPublicKey, propertyPda, investmentPda, txSignature } =
		parseResult.data;

	try {
		const cacheKey =
			RedisKeyTemplates.investmentsByInvestor(investorPublicKey);
		await redis.del(cacheKey);
		await redis.del(RedisKeyTemplates.property(propertyPda));
		await redis.del(RedisKeys.Properties);
		await redis.del(RedisKeys.PropertiesAll);

		const investmentAccount = await waitForInvestmentAccount(investmentPda);

		if (!investmentAccount) {
			throw {
				code: 404,
				message: "Investment account not found on-chain",
			};
		}

		const investmentData = {
			investor_public_key: investorPublicKey,
			property_pda: propertyPda,
			amount: investmentAccount.tokensOwned.toNumber(),
			dividends_claimed: investmentAccount.dividendsClaimed.toNumber(),
			investment_pda: investmentPda,
			created_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from("investments")
			.insert([investmentData])
			.select("*")
			.single();

		if (error || !data) {
			console.error("Error inserting investment into Supabase:", error);
			throw { code: 500, message: "Failed to record investment" };
		}

		const updatedInvestments = await getInvestmentsByInvestor(
			investorPublicKey
		);
		await redis.set(cacheKey, JSON.stringify(updatedInvestments));

		const updatedProperties = await getProperties();
		await redis.set(
			RedisKeys.PropertiesAll,
			JSON.stringify(updatedProperties)
		);

		return { investment: data };
	} catch (err: any) {
		console.error("Error handling create investment:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to create investment",
		};
	}
};

async function waitForInvestmentAccount(
	investmentPda: string,
	timeout = 30000,
	interval = 500
): Promise<any> {
	const startTime = Date.now();
	let attempts = 0;
	while (Date.now() - startTime < timeout) {
		attempts++;
		try {
			const investmentAccount = await getInvestment(investmentPda);
			if (investmentAccount) {
				console.log(
					`Investment account found after ${attempts} attempts`
				);
				return investmentAccount;
			}
		} catch (err: any) {
			if (err.code === 404) {
				await new Promise((resolve) => setTimeout(resolve, interval));
				continue;
			} else {
				throw err;
			}
		}
	}
	console.error(`Investment account not found after ${attempts} attempts`);
	throw {
		code: 404,
		message: "Investment account not found on-chain after waiting",
	};
}
