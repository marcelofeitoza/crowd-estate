import { z } from "zod";
import { Role } from "../../models/User";
import { supabase } from "../../services/supabase";

const createHandleRegisterSchema = z.object({
	publicKey: z.string().min(32),
	name: z.string().min(1),
	role: z.enum([Role.Investor, Role.Landlord]),
});

export const handleRegister = async (body: any) => {
	console.log("Registering user:", body);
	const {
		data: { publicKey, name, role },
	} = createHandleRegisterSchema.safeParse(body);

	if (!publicKey || !name || !role) {
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

	return { user };
};
