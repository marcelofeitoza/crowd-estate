import {
	getInvestmentsByInvestor,
	getProperties,
	getPropertiesByPDAs,
	program,
} from "../../services/crowd-estate";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { Investment } from "../../models/Investment";
import { redis, RedisKeys } from "../../services/redis";
import { supabase } from "../../services/supabase";
import { Property } from "../../models/Property";

const listInvestmentsSchema = z.object({
	publicKey: z.string().min(32),
	forceRefresh: z.boolean().optional(),
});

export const updateSupabaseWithInvestments = async (
	investments: Investment[]
): Promise<void> => {
	try {
		const investmentDatabases = investments.map((investment) => ({
			investor_public_key: investment.investor,
			property_pda: investment.property,
			amount: investment.amount,
			dividends_claimed: investment.dividendsClaimed,
			investment_pda: investment.publicKey,
			created_at: new Date().toISOString(),
		}));

		const { error } = await supabase
			.from("investments")
			.upsert(investmentDatabases, {
				onConflict: "investment_pda",
			});

		if (error) {
			console.error("Error upserting investments to Supabase:", error);
			throw {
				code: 500,
				message: "Failed to update investments in database",
			};
		}

		console.log("Supabase investments updated successfully");
	} catch (error) {
		console.error("Error updating Supabase:", error);
		throw error;
	}
};

export const handleListInvestments = async (body: any) => {
	const parseResult = listInvestmentsSchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}
	const { publicKey, forceRefresh } = parseResult.data;

	try {
		const cacheKey = `investmentsData:${publicKey}`;
		const cachedResult = await redis.get(cacheKey);
		if (cachedResult) {
			console.log("Returning investments data from cache");
			return JSON.parse(cachedResult);
		}

		const investmentsData = await getInvestmentsByInvestor(publicKey);

		let properties: Property[];
		const cachedProperties = await redis.get(RedisKeys.PropertiesAll);
		if (cachedProperties) {
			properties = JSON.parse(cachedProperties);
		} else {
			properties = await getProperties(
				undefined,
				undefined,
				forceRefresh
			);
		}

		const propertyPDAs = [
			...new Set(investmentsData.map((inv) => inv.property)),
		];
		properties = await getPropertiesByPDAs(propertyPDAs);
		let invested = 0;
		let returns = 0;

		investmentsData.forEach((investment) => {
			const property = properties.find(
				(p) => p.publicKey === investment.property
			);
			if (property) {
				invested += investment.amount * property.token_price_usdc;
				returns += investment.dividendsClaimed / 1e6;
			}
		});

		const result = { investmentsData, invested, returns };
		await redis.set(cacheKey, JSON.stringify(result));

		return result;
	} catch (error) {
		console.error("Error fetching investments:", error);
		throw { code: 500, message: "Failed to fetch investments" };
	}
};
