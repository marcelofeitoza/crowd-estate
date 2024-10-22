import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { registerUser, loginUser, updateProfile } from "../services/user";
import {
	createProperty,
	investInProperty,
	getInvestments,
} from "../services/property";

dotenv.config();

export const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_KEY!
);

interface JsonRpcRequest {
	jsonrpc: string;
	method: string;
	params: any;
	id: number | string | null;
}

export const handleJsonRpcRequest = async (body: string) => {
	const { jsonrpc, method, params, id }: JsonRpcRequest = JSON.parse(body);

	console.log("Method: ", method);
	console.log("Params: ", params);

	try {
		let result;
		switch (method) {
			case "registerUser":
				result = await registerUser({
					name: params.name,
					email: params.email,
				});
				break;
			case "createProperty":
				result = await createProperty({
					name: params.name,
					totalTokens: params.totalTokens,
					pricePerToken: params.pricePerToken,
					symbol: params.symbol,
					location: params.location,
					creator: params.creatorPubkey,
				});
				break;
			case "investInProperty":
				result = await investInProperty({
					propertyPubkey: params.propertyPubkey,
					investorPubkey: params.investorPubkey,
					usdcAmount: params.usdcAmount,
				});
				break;
			case "getInvestments":
				result = await getInvestments({
					userPubkey: params.userPubkey,
				});
				break;
			default:
				throw new Error("Method not found");
		}

		return {
			jsonrpc,
			result,
			id,
		};
	} catch (error: any) {
		return {
			jsonrpc,
			error: {
				code: error.code || -32602,
				message: error.message || "Internal error",
			},
			id,
		};
	}
};
