import { z } from "zod";
import { program } from "../../services/crowd-estate";
import { supabase } from "../../services/supabase";
import { redis } from "../../services/redis";

// {
//     "amount": 90,
//     "propertyPda": "CtcH7rWRxkpf3cGwn4qq5zevMK2PP7zrPkmDkSvJtQyp",
//     "userPublicKey": "AohfrTqQwDFGpco3AVHQjCwyJgnXvyT5Ytz8dwppib9E",
//     "txSignature": "4hFkPMSE4MwbzG6BnUjH5qBwFyrsJokVhr8P2yvRV8GVXnQEFKBPmEMJRYqgZkALNzjqVDZ4yxcbrUHMBV6WGWWL"
// }
const distributeDividendsSchema = z.object({
	amount: z.number().positive(),
	propertyPda: z.string().min(32),
	userPublicKey: z.string().min(32),
	txSignature: z.string().min(64),
});

export const handleDistributeDividends = async (body: any) => {
	const parseResult = distributeDividendsSchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}
	const { userPublicKey, propertyPda, amount, txSignature } =
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
			.from("properties")
			.update({ dividends_total: amount })
			.eq("property_pda", propertyPda);

		if (error) {
			console.error("Error updating property dividends:", error);
			throw { code: 500, message: "Failed to distribute dividends" };
		}

		await redis.del("properties");

		return { message: "Dividends distributed successfully" };
	} catch (err: any) {
		console.error("Error handling distribute dividends:", err);
		throw {
			code: err.code || 500,
			message: err.message || "Failed to distribute dividends",
		};
	}
};
