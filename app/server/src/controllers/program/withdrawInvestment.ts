import { z } from "zod";
import {
	getInvestmentsByInvestor,
	getProperties,
	program,
} from "../../services/crowd-estate";
import { supabase } from "../../services/supabase";
import { updateSupabaseWithProperties } from "./listProperties";
import { updateSupabaseWithInvestments } from "./listInvestments";
import { redis } from "../../services/redis";

const withdrawInvestmentSchema = z.object({
	investmentPda: z.string().min(32),
	investorPublicKey: z.string().min(32),
	propertyPda: z.string().min(32),
	txSignature: z.string().min(32),
});

export const handleWithdrawInvestment = async (body: any) => {
	const parseResult = withdrawInvestmentSchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}
	const { investmentPda, txSignature, investorPublicKey, propertyPda } =
		parseResult.data;

	try {
		const transaction = await program.provider.connection.getTransaction(
			txSignature,
			{
				commitment: "confirmed",
				maxSupportedTransactionVersion: 0,
			}
		);

		if (!transaction) {
			throw { code: 404, message: "Transaction not found" };
		}

		const { data, error } = await supabase
			.from("investments")
			.delete()
			.eq("investment_pda", investmentPda);

		const properties = await getProperties();
		updateSupabaseWithProperties(properties);

		const investments = await getInvestmentsByInvestor(investorPublicKey);
		updateSupabaseWithInvestments(investments);

		if (error) {
			console.error("Error deleting investment:", error);
			throw { code: 500, message: "Failed to withdraw investment" };
		}

		const cacheKey = `investmentsData:${investorPublicKey}`;
		const cachedResult = await redis.get(cacheKey);
		if (cachedResult) {
			const result = JSON.parse(cachedResult);
			result.investmentsData = result.investmentsData.filter(
				(inv) => inv.publicKey !== investmentPda
			);
			let invested = 0;
			let returns = 0;

			result.investmentsData.forEach((investment) => {
				const property = properties.find(
					(p) => p.publicKey === investment.property
				);
				if (property) {
					invested += investment.amount * property.token_price_usdc;
					returns += investment.dividendsClaimed / 1e6;
				}
			});

			result.invested = invested;
			result.returns = returns;

			await redis.set(cacheKey, JSON.stringify(result));
		}

		await redis.del(cacheKey);
		await redis.del("properties");

		return { message: "Investment withdrawn successfully" };
	} catch (err: any) {
		console.error("Error handling withdraw investment:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to withdraw investment",
		};
	}
};
