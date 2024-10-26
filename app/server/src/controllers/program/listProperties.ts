import { z } from "zod";
import { Property, PropertyDatabase } from "../../models/Property";
import { getProperties, getProperty } from "../../services/crowd-estate";
import redisClient from "../../services/redis";
import { supabase } from "../../services/supabase";

const fetchPropertiesFromRPC = async (
	propertyPda?: string
): Promise<Property[]> => {
	try {
		if (propertyPda) {
			const data = await getProperty(propertyPda);
			return [data];
		} else {
			const data = await getProperties();
			return data;
		}
	} catch (error) {
		console.error("Error fetching properties from RPC:", error);
		throw { code: 500, message: "Failed to fetch properties from RPC" };
	}
};

const updateSupabaseWithProperties = async (
	properties: Property[]
): Promise<void> => {
	try {
		const propertiesDatabase = properties.map((property) => ({
			property_pda: property.property_pda,
			creator_public_key: property.creator_public_key,
		}));

		const { data, error } = await supabase
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

		console.log("Supabase properties updated successfully");
	} catch (error) {
		console.error("Error updating Supabase:", error);
		throw error;
	}
};

export enum Filters {
	ALL = "ALL",
	OPEN = "OPEN",
	CLOSED = "CLOSED",
	USER = "USER",
}

const handleListPropertiesSchema = z.object({
	filters: z.array(z.nativeEnum(Filters)).optional(),
	userPublicKey: z.string().min(32).optional(),
});

export const handleListProperties = async (
	body: any
): Promise<{
	properties: Property[];
}> => {
	const parseResult = handleListPropertiesSchema.safeParse(body);

	if (!parseResult.success) {
		throw {
			code: 400,
			message: "Invalid input parameters",
		};
	}

	const { filters, userPublicKey } = parseResult.data;

	try {
		const properties = await getProperties(filters, userPublicKey);

		await redisClient.setEx("properties", 3600, JSON.stringify(properties));

		return { properties };
	} catch (error: any) {
		console.error("Error handling list properties:", error);
		throw {
			code: error.code || 500,
			message: error.message || "Internal server error",
		};
	}
};
