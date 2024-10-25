import { Role } from "../../models/User";
import redisClient from "../../services/redis";
import { supabase } from "../../services/supabase";

export const handleRegister = async (body: any) => {
	const { publicKey, name, role } = body;

	if (!publicKey || !name) {
		throw { code: 400, message: "Missing parameters" };
	}

	try {
		const { data: existingUser, error } = await supabase
			.from("users")
			.select("*")
			.eq("public_key", publicKey)
			.single();

		if (existingUser) {
			throw { code: 409, message: "User already exists" };
		}
	} catch (err: any) {
		if (err.code === 409) {
			throw err;
		}
	}

	const { data, error } = await supabase
		.from("users")
		.insert([
			{
				public_key: publicKey,
				name,
				role: role || Role.Investor,
			},
		])
		.select("*")
		.single();

	if (error || !data) {
		console.error("Error registering user in Supabase:", error);
		throw { code: 500, message: "Failed to register user" };
	}

	const user = {
		id: data.id,
		publicKey: data.public_key,
		name: data.name,
		role: data.role,
	};

	try {
		await redisClient.setEx(
			`user:${publicKey}`,
			3600,
			JSON.stringify(user)
		);
	} catch (err) {
		console.error("Error storing user in Redis:", err);
	}

	return { user };
};
