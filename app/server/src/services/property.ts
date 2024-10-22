import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { supabase } from "../controllers/rpcController";
import {
	connection,
	executeCreatePropertyTransaction,
	executeInvestInPropertyTransaction,
	fetchInvestmentAccount,
	getInvestmentAccountData,
} from "./solana";
import { AnchorProvider } from "@coral-xyz/anchor";

export const createProperty = async ({
	name,
	totalTokens,
	pricePerToken,
	symbol,
	location,
	creator,
}) => {
	try {
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("pubkey", creator)
			.single();

		if (userError) {
			throw new Error(`User not found: ${userError.message}`);
		}

		const propertyPda = await executeCreatePropertyTransaction(
			user,
			name,
			totalTokens,
			pricePerToken,
			symbol
		);

		const { data, error } = await supabase.from("properties").insert([
			{
				name,
				location,
				pubkey: propertyPda,
				created_by: creator,
			},
		]);

		if (error) {
			throw new Error(error.message);
		}

		return {
			message: "Property created successfully",
			pubkey: propertyPda,
		};
	} catch (error) {
		throw new Error(`Failed to create property: ${error.message}`);
	}
};

export const investInProperty = async ({
	propertyPubkey,
	investorPubkey,
	usdcAmount,
}) => {
	try {
		const { data: user, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("pubkey", investorPubkey)
			.single();

		if (userError) {
			throw new Error(`User not found: ${userError.message}`);
		}

		const { data: property, error: propertyError } = await supabase
			.from("properties")
			.select("*")
			.eq("pubkey", propertyPubkey)
			.single();

		if (propertyError) {
			throw new Error(`Property not found: ${propertyError.message}`);
		}

		const { data: admin, error: adminError } = await supabase
			.from("users")
			.select("*")
			.eq("pubkey", property.created_by)
			.single();

		if (adminError) {
			throw new Error(`Admin not found: ${adminError.message}`);
		}

		console.log(
			"Investor: ",
			user,
			" Admin: ",
			admin,
			" Property: ",
			property
		);

		const investmentPda = await executeInvestInPropertyTransaction(
			user,
			admin,
			property,
			usdcAmount
		);

		console.log("Investment successful");

		const { data, error } = await supabase.from("investments").insert([
			{
				user_pubkey: investorPubkey,
				property_pubkey: propertyPubkey,
				amount: usdcAmount,
				investment_pda: investmentPda,
			},
		]);

		console.log("Investment record created");

		if (error) {
			throw new Error(error.message);
		}

		return { message: "Investment successful", pubkey: investmentPda };
	} catch (error) {
		throw new Error(`Failed to invest in property: ${error.message}`);
	}
};

export const getInvestments = async ({ userPubkey }) => {
	try {
		const { data, error } = await supabase
			.from("investments")
			.select("*")
			.eq("user_pubkey", userPubkey);

		console.log("Investments: ", data);

		if (error) {
			throw new Error(error.message);
		}

		const { data: investor, error: investorError } = await supabase
			.from("users")
			.select("*")
			.eq("pubkey", userPubkey)
			.single();

		if (investorError) {
			throw new Error(`Investor not found: ${investorError.message}`);
		}

		const investmentsWithDetails = await Promise.all(
			data.map(async (investment) => {
				const investmentPda = new PublicKey(investment.investment_pda);
				const investmentAccountData = await getInvestmentAccountData(
					investmentPda,
					investment,
					investor
				);
				return {
					...investment,
					...investmentAccountData,
				};
			})
		);

		return investmentsWithDetails;
	} catch (error) {
		throw new Error(`Failed to get investments: ${error.message}`);
	}
};

export const getUserInvestments = async (userPubkey: string) => {
	try {
		const investments = await getInvestments({ userPubkey });
		console.log("User Investments:", investments);
	} catch (error) {
		console.error("Failed to retrieve user investments:", error);
	}
};
