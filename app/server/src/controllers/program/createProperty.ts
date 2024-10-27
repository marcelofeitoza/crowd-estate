import { Property } from "../../models/Property";
import { User } from "../../models/User";
import {
	getProperties,
	provider,
	verifyProperty,
} from "../../services/crowd-estate";
import { redis, RedisKeys, RedisKeyTemplates } from "../../services/redis";
import { supabase } from "../../services/supabase";
import { z } from "zod";
import { updateSupabaseWithProperties } from "./listProperties";

const createPropertySchema = z.object({
	userPublicKey: z.string().min(32),
	propertyPda: z.string().min(32),
	txSignature: z.string().min(64),
});

export const handleCreateProperty = async (
	body: any
): Promise<{
	property: Property;
}> => {
	const parseResult = createPropertySchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}
	const { userPublicKey, propertyPda, txSignature } = parseResult.data;

	try {
		const cacheKey = RedisKeyTemplates.property(propertyPda);
		await redis.del(cacheKey);
		await redis.del(RedisKeyTemplates.property(propertyPda));
		await redis.del(RedisKeys.Properties);
		await redis.del(RedisKeys.PropertiesAll);

		const property = await verifyProperty(propertyPda);

		if (!userPublicKey || !property) {
			throw { code: 400, message: "Missing parameters" };
		}

		let user: User | null = null;
		let { data: userData, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("public_key", userPublicKey)
			.single();
		console.log("userData", userData);
		console.log("error", userError);

		if (userError || !userData) {
			console.error("User not found:", userError);
			throw { code: 404, message: "User not found" };
		}

		user = userData as User;

		if (user.role !== "landlord") {
			throw {
				code: 403,
				message: "User is not authorized to create properties",
			};
		}

		let { data: existingProperty } = await supabase
			.from("properties")
			.select("*")
			.eq("property_pda", propertyPda)
			.single();

		if (existingProperty) {
			throw { code: 409, message: "Property already exists" };
		}

		const { data: propertyData, error } = await supabase
			.from("properties")
			.insert([
				{
					property_pda: propertyPda,
					creator_public_key: userPublicKey,
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
				},
			])
			.select("*")
			.single();

		if (error || !propertyData) {
			console.error("Error inserting property:", error);
			throw { code: 500, message: "Failed to create property" };
		}

		const properties = await getProperties();
		updateSupabaseWithProperties(properties);

		return { property };
	} catch (err: any) {
		console.error("Error creating property:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to create property",
		};
	}
};
