import { Property } from "../../models/Property";
import { User } from "../../models/User";
import redisClient from "../../services/redis";
import { supabase } from "../../services/supabase";

export const handleCreateProperty = async (
	body: any
): Promise<{
	property: Property;
}> => {
	const {
		publicKey,
		propertyName,
		totalTokens,
		pricePerToken,
		tokenSymbol,
		propertyPda,
	} = body;

	if (
		!publicKey ||
		!propertyName ||
		!totalTokens ||
		!pricePerToken ||
		!tokenSymbol ||
		!propertyPda
	) {
		throw { code: 400, message: "Missing parameters" };
	}

	let user: User | null = null;
	try {
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("public_key", publicKey)
			.single();

		if (error || !data) {
			console.error("User not found:", error);
			throw { code: 404, message: "User not found" };
		}

		user = data as User;
	} catch (err: any) {
		if (err.code === 404) {
			throw { code: 404, message: "User not found" };
		}
		console.error("Error fetching user:", err);
		throw { code: 500, message: "Internal server error" };
	}

	try {
		const { data: existingProperty, error } = await supabase
			.from("properties")
			.select("*")
			.eq("property_pda", propertyPda)
			.single();

		if (existingProperty) {
			throw { code: 409, message: "Property already exists" };
		}
	} catch (err: any) {
		if (err.code === 409) {
			throw err;
		}
	}

	try {
		const { data, error } = await supabase
			.from("properties")
			.insert([
				{
					name: propertyName,
					total_tokens: totalTokens,
					price_per_token: pricePerToken,
					token_symbol: tokenSymbol,
					property_pda: propertyPda,
					creator_public_key: publicKey,
				},
			])
			.select("*")
			.single();

		if (error || !data) {
			console.error("Error inserting property:", error);
			throw { code: 500, message: "Failed to create property" };
		}

		const property = data;

		try {
			await redisClient.setEx(
				`property:${propertyPda}`,
				3600,
				JSON.stringify(property)
			);
		} catch (err) {
			console.error("Error caching property in Redis:", err);
		}

		return { property };
	} catch (err: any) {
		console.error("Error creating property:", err);
		throw { code: 500, message: "Failed to create property" };
	}
};
