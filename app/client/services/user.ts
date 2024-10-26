import { User } from "@/components/AuthContext";
import { axios } from "@/utils/axios";

export const getUserData = async (publicKey: string): Promise<User | null> => {
	try {
		const response = await axios.post("/login", {
			publicKey,
		});

		const user: User = response.data.user;
		return user;
	} catch (error) {
		if (error.response && error.response.status === 404) {
			return null;
		}
		console.error("Error getting user data:", error);
		throw new Error("Error getting user data");
	}
};

export const registerUser = async (user: User): Promise<User | null> => {
	try {
		const response = await axios.post("/register", user);
		const newUser: User = response.data.user;
		return newUser;
	} catch (error) {
		console.error(error);
		throw new Error("Error registering user");
	}
};

// Program related
export interface PropertyResponse {
	name: string;
	total_tokens: number;
	price_per_token: number;
	token_symbol: string;
	property_pda: string;
	creator_public_key: string;
	created_at: string;
	id: number;
}

export const createPropertyBackend = async (property: {
	userPublicKey: string;
	propertyPda: string;
}) => {
	try {
		await axios.post("/create-property", property);
	} catch (error) {
		if (
			error.response &&
			error.response.data &&
			error.response.data.error
		) {
			throw new Error(error.response.data.error);
		}
		console.error("Error creating property:", error);
	}
};
