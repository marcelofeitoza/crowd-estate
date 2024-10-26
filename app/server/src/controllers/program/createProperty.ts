import { Property } from "../../models/Property";
import { User } from "../../models/User";
import { verifyProperty } from "../../services/crowd-estate";
import redisClient from "../../services/redis";
import { supabase } from "../../services/supabase";
import { z } from "zod";

const createPropertySchema = z.object({
	userPublicKey: z.string().min(32),
	propertyPda: z.string().min(32),
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
	const { userPublicKey, propertyPda } = parseResult.data;

	try {
		await verifyProperty(propertyPda);

		if (!userPublicKey || !propertyPda) {
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
				},
			])
			.select("*")
			.single();

		if (error || !propertyData) {
			console.error("Error inserting property:", error);
			throw { code: 500, message: "Failed to create property" };
		}

		const property: Property = propertyData;

		await redisClient.setEx(
			`property:${propertyPda}`,
			3600,
			JSON.stringify(property)
		);
		console.log("Property cached in Redis");

		await redisClient.del("properties");
		console.log("Properties cache invalidated");

		return { property };
	} catch (err: any) {
		console.error("Error creating property:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to create property",
		};
	}
};
