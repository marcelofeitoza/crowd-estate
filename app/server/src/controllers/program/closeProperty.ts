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
		// const transaction = await program.provider.connection.getTransaction(
		// 	txSignature,
		// 	{
		// 		commitment: "confirmed",
		// 		maxSupportedTransactionVersion: 0,
		// 	}
		// );

		// if (!transaction) {
		// 	throw { code: 404, message: "Transaction not found" };
		// }

		const { data, error } = await supabase
			.from("properties")
			.delete()
			// .update({ is_closed: true })
			.eq("property_pda", propertyPda);

		if (error) {
			console.error("Error updating property in Supabase:", error);
			throw { code: 500, message: "Failed to close property" };
		}

		console.log("Propriedade atualizada no Supabase com is_closed: true");

		const cacheKeys = [
			RedisKeys.PropertiesAll,
			RedisKeyTemplates.property(propertyPda),
			RedisKeys.Properties,
		];
		console.log(`Invalidando as chaves de cache: ${cacheKeys.join(", ")}`);
		await redis.invalidate(cacheKeys);

		console.log("Buscando propriedades atualizadas com forceRefresh=true");
		const properties = await getProperties(undefined, undefined, true);
		await updateSupabaseWithProperties(properties);

		console.log(
			"Propriedades atualizadas no Supabase a partir da blockchain"
		);

		return { message: "Property closed successfully" };
	} catch (err: any) {
		console.error("Error handling close property:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to close property",
		};
	}
};
