import { z } from "zod";
import { User } from "../../models/User";
import redisClient from "../../services/redis";
import { supabase } from "../../services/supabase";

const createHandleLoginSchema = z.object({
	publicKey: z.string().nonempty(),
});

export const handleLogin = async (body: any) => {
	const parseResult = createHandleLoginSchema.safeParse(body);

	if (!parseResult.success) {
		throw {
			code: 400,
			message: "Invalid input parameters",
		};
	}

	const { publicKey } = parseResult.data;

	if (!publicKey) {
		throw { code: 400, message: "Missing publicKey parameter" };
	}

	let user: User | null = null;
	try {
		const cachedUser = await redisClient.get(`user:${publicKey}`);
		if (cachedUser) {
			user = JSON.parse(cachedUser);
			console.log("User found in Redis cache");
		} else {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("public_key", publicKey)
				.single();

			if (error || !data) {
				console.error("Error fetching user from Supabase:", error);
				throw { code: 404, message: "User not found" };
			}

			user = {
				id: data.id,
				publicKey: data.public_key,
				name: data.name,
				role: data.role,
			};

			await redisClient.setEx(
				`user:${publicKey}`,
				60,
				JSON.stringify(user)
			);

			console.log("User found in Supabase and stored in Redis");
		}
	} catch (err: any) {
		if (err.code === 404) {
			throw { code: 404, message: "User not found" };
		}
		console.error("Error during login:", err);
		throw { code: 500, message: "Internal server error" };
	}

	return { user };
};
