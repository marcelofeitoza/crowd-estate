import { z } from "zod";
import { getProperties, program } from "../../services/crowd-estate";
import { supabase } from "../../services/supabase";
import { updateSupabaseWithProperties } from "./listProperties";
import { redis, RedisKeys, RedisKeyTemplates } from "../../services/redis";

const closePropertySchema = z.object({
	userPublicKey: z.string().min(32),
	propertyPda: z.string().min(32),
	txSignature: z.string().min(64),
});

export const handleCloseProperty = async (body: any) => {
	const parseResult = closePropertySchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}
	const { userPublicKey, propertyPda, txSignature } = parseResult.data;

	try {
		const { data, error } = await supabase
			.from("properties")
			.update({ is_closed: true })
			.eq("property_pda", propertyPda);

		if (error) {
			console.error("Error closing property:", error);
			throw { code: 500, message: "Failed to close property" };
		}

		await redis.del(RedisKeys.PropertiesAll);
		await redis.del(RedisKeyTemplates.property(propertyPda));
		await redis.del(RedisKeys.Properties);

		const properties = await getProperties();
		await updateSupabaseWithProperties(properties);

		return { message: "Property closed successfully" };
	} catch (err: any) {
		console.error("Error handling close property:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to close property",
		};
	}
};
