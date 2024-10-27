import { User } from "@/components/AuthContext";
import { axios } from "@/utils/axios";

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

export const getUserData = async (publicKey: string): Promise<User> => {
	try {
		const response = await axios.post("/user/login", {
			publicKey,
		});

		const user: User = response.data.user;
		return user;
	} catch (error) {
		console.error(
			"Error getting user data:",
			error.response.data.error || error
		);
	}
};

export const registerUser = async (user: User): Promise<User> => {
	try {
		const response = await axios.post("/user/register", user);
		const newUser: User = response.data.user;
		return newUser;
	} catch (error) {
		console.error(
			"Error registering user:",
			error.response.data.error || error
		);
	}
};

export const createPropertyBackend = async (property: {
	userPublicKey: string;
	propertyPda: string;
	txSignature: string;
}) => {
	try {
		await axios.post("/program/create-property", property);
	} catch (error) {
		console.error(
			"Error creating property:",
			error.response.data.error || error
		);
	}
};

export const createInvestmentBackend = async (investment: {
	investorPublicKey: string;
	propertyPda: string;
	investmentPda: string;
	txSignature: string;
}) => {
	try {
		await axios.post("/program/create-investment", investment);
	} catch (error) {
		console.error(
			"Error creating investment:",
			error.response.data.error || error
		);
	}
};

export const withdrawInvestmentBackend = async (investment: {
	investmentPda: string;
	investorPublicKey: string;
	propertyPda: string;
	txSignature: string;
}) => {
	try {
		await axios.post("/program/withdraw-investment", investment);
	} catch (error) {
		console.error(
			"Error withdrawing investment:",
			error.response.data.error || error
		);
	}
}

export const distributeDividendsBackend = async (dividends: {
	propertyPda: string;
	userPublicKey: string;
	txSignature: string;
	amount: number;
}) => {
	try {
		await axios.post("/program/distribute-dividends", dividends);
	} catch (error) {
		console.error(
			"Error distributing dividends:",
			error.response.data.error || error
		);
	}
}

export const closePropertyBackend = async (property: {
	propertyPda: string;
	userPublicKey: string;
	txSignature: string;
}) => {
	try {
		await axios.post("/program/close-property", property);
	} catch (error) {
		console.error(
			"Error closing property:",
			error.response.data.error || error
		);
	}
}