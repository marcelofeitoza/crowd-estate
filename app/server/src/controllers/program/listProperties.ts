import { z } from "zod";
import { Property } from "../../models/Property";
import { getProperties } from "../../services/crowd-estate";
import { redis, RedisKeys } from "../../services/redis";
import { supabase } from "../../services/supabase";

export enum Filters {
	ALL = "ALL",
	OPEN = "OPEN",
	CLOSED = "CLOSED",
	USER = "USER",
}

const handleListPropertiesSchema = z.object({
	filters: z.array(z.nativeEnum(Filters)).optional(),
	userPublicKey: z.string().min(32).optional(),
	forceRefresh: z.boolean().optional(),
});

export const updateSupabaseWithProperties = async (
	properties: Property[]
): Promise<void> => {
	try {
		const propertiesDatabase = properties.map((property) => ({
			property_pda: property.publicKey,
			creator_public_key: property.admin,
			property_name: property.property_name,
			total_tokens: property.total_tokens,
			available_tokens: property.available_tokens,
			token_price_usdc: property.token_price_usdc,
			token_symbol: property.token_symbol,
			admin: property.admin,
			mint: property.mint,
			bump: property.bump,
			dividends_total: property.dividends_total,
			is_closed: property.is_closed,
		}));

		const { error } = await supabase
			.from("properties")
			.upsert(propertiesDatabase, {
				onConflict: "property_pda",
			});

		if (error) {
			console.error("Error upserting properties to Supabase:", error);
			throw {
				code: 500,
				message: "Failed to update properties in database",
			};
		}
		await redis.set(RedisKeys.Properties, properties);

		console.log("Supabase properties updated successfully");
	} catch (error: any) {
		console.error("Error updating Supabase:", error);
		throw {
			code: 500,
			message: "Failed to update properties in database",
		};
	}
};

export const handleListProperties = async (
	body: any
): Promise<{ properties: Property[] }> => {
	const parseResult = handleListPropertiesSchema.safeParse(body);

	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}

	const {
		filters = [Filters.ALL],
		userPublicKey,
		forceRefresh,
	} = parseResult.data;

	try {
		const properties = await getProperties(
			filters,
			userPublicKey,
			forceRefresh
		);
		return { properties };
	} catch (error: any) {
		console.error("Error handling list properties:", error);
		throw {
			code: error.code || 500,
			message: error.message || "Internal server error",
		};
	}
};
