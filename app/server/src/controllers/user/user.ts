import { Request, Response } from "express";
import { supabase } from "../../services/supabase";
import { UserWithInvestments } from "../../models/User";

export const getAllUsersWithInvestments = async (
	req: Request,
	res: Response
) => {
	try {
		const landlordPubkey = req.params.landlord;

		const { data: user, error: userError } = await supabase
			.from("users")
			.select("role")
			.eq("public_key", landlordPubkey)
			.single();

		if (userError) {
			throw userError;
		}

		if (!user || user.role !== "landlord") {
			return res.status(401).json({ error: "Unauthorized access" });
		}

		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("name, public_key, role")
			.eq("role", "investor");

		if (usersError) {
			throw usersError;
		}

		const usersWithInvestments: UserWithInvestments[] = await Promise.all(
			users.map(async (user: any) => {
				const { data: investments, error: investmentsError } =
					await supabase
						.from("investments")
						.select("*")
						.eq("investor_public_key", user.wallet);

				if (investmentsError) {
					throw investmentsError;
				}

				return {
					name: user.name,
					wallet: user.public_key,
					investments: investments || [],
				};
			})
		);

		console.log(
			"\nRetrieved users with investments:",
			JSON.stringify(usersWithInvestments, null, 4)
		);

		return res.status(200).json(usersWithInvestments);
	} catch (error: any) {
		console.error("Error fetching users with investments:", error.message);
		return res.status(500).json({ error: "Internal server error" });
	}
};
