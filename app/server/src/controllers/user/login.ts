import { z } from "zod";
import { Role, User } from "../../models/User";
import { supabase } from "../../services/supabase";

const createHandleLoginSchema = z.object({
	publicKey: z.string().min(1),
});

export const handleLogin = async (body: any) => {
	const parseResult = createHandleLoginSchema.safeParse(body);

	if (!parseResult.success) {
		console.error("Invalid input parameters:", parseResult.error);
		throw {
			code: 400,
			message: "Invalid input parameters",
		};
	}

	const { publicKey } = parseResult.data;

	if (!publicKey) {
		console.error("Missing publicKey parameter");
		throw { code: 400, message: "Missing publicKey parameter" };
	}

	let user: User | null = null;
	try {
		console.log("Fetching user with publicKey:", publicKey);
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("public_key", publicKey.toString())
			.single();

		if (error || !data) {
			console.error("Error fetching user from Supabase:", error);
			throw { code: 404, message: "User not found" };
		}

		user = {
			id: data.id,
			publicKey: data.public_key,
			name: data.name,
			role: data.role as Role,
		};
	} catch (err: any) {
		if (err.message && err.message.includes("fetch failed")) {
			console.error("Network error during login:", err);
			throw { code: 503, message: "Service unavailable" };
		}
		if (err.code === 404) {
			console.error("User not found:", err);
			throw { code: 404, message: "User not found" };
		}
		console.error("Error during login:", err);
		throw { code: 500, message: "Internal server error" };
	}

	return { user };
};
