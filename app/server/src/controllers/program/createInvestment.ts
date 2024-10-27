import { z } from "zod";
import {
	getInvestment,
	getInvestmentsByInvestor,
	getProperties,
} from "../../services/crowd-estate";
import { supabase } from "../../services/supabase";
import { RedisKeyTemplates, redis, RedisKeys } from "../../services/redis";
import { Investment } from "../../models/Investment";

const createInvestmentSchema = z.object({
	investorPublicKey: z.string().min(32),
	propertyPda: z.string().min(32),
	investmentPda: z.string().min(32),
	txSignature: z.string().min(64),
});

export const handleCreateInvestment = async (body: any) => {
	const parseResult = createInvestmentSchema.safeParse(body);
	if (!parseResult.success) {
		console.error("Invalid input parameters:", parseResult.error);
		throw { code: 400, message: "Invalid input parameters" };
	}

	const { investorPublicKey, propertyPda, investmentPda, txSignature } =
		parseResult.data;

	try {
		const cacheKeys = [
			RedisKeyTemplates.investmentsByInvestor(investorPublicKey),
			RedisKeyTemplates.investmentsDataByInvestor(investorPublicKey), // Adicionado
			RedisKeyTemplates.property(propertyPda),
			RedisKeys.Properties,
			RedisKeys.PropertiesAll,
		];
		console.log("Invalidating cache keys:", cacheKeys);
		await redis.invalidate(cacheKeys);

		// const investmentAccount = await waitForInvestmentAccount(investmentPda);
		// console.log("Investment Account:", investmentAccount);

		// if (!investmentAccount) {
		// 	throw {
		// 		code: 404,
		// 		message: "Investment account not found on-chain",
		// 	};
		// }

		const investmentData = {
			investor_public_key: investorPublicKey,
			property_pda: propertyPda,
			// amount: investmentAccount.amount,
			// dividends_claimed: investmentAccount.dividendsClaimed,
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

		console.log("Investment successfully inserted into Supabase");

		const updatedInvestments = await getInvestmentsByInvestor(
			investorPublicKey
		);
		await redis.set(
			RedisKeyTemplates.investmentsByInvestor(investorPublicKey),
			updatedInvestments
		);
		console.log("Updated investmentsByInvestor cache");

		const properties = await getProperties();
		let invested = 0;
		let returns = 0;

		updatedInvestments.forEach((investment: Investment) => {
			const property = properties.find(
				(p) => p.publicKey === investment.property
			);
			if (property) {
				invested += investment.amount * property.token_price_usdc;
				returns += investment.dividendsClaimed / 1e6;
			}
		});

		const investmentsDataResult = {
			investmentsData: updatedInvestments,
			invested,
			returns,
		};
		await redis.set(
			RedisKeyTemplates.investmentsDataByInvestor(investorPublicKey),
			investmentsDataResult
		);
		console.log("Updated investmentsDataByInvestor cache");

		// Atualiza o cache de PropertiesAll
		await redis.set(RedisKeys.PropertiesAll, properties);
		console.log("Updated PropertiesAll cache");

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
				console.log(
					`Attempt ${attempts}: Investment account not found. Retrying in ${interval}ms...`
				);
				await new Promise((resolve) => setTimeout(resolve, interval));
				continue;
			} else {
				console.error(`Attempt ${attempts}: Unexpected error:`, err);
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
