import { CrowdEstate } from "@/idl/types/crowd_estate";
import { axios } from "@/utils/axios";
import { Investment, Property } from "@/utils/solana";
import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

export enum Filters {
	ALL = "ALL",
	OPEN = "OPEN",
	CLOSED = "CLOSED",
	USER = "USER",
}

export const getProperties = async (
	userPublicKey?: string,
	filters: Filters[] = [Filters.ALL],
): Promise<Property[]> => {
	try {
		const properties: Property[] = await axios.post("/list-properties", {
			filters,
			userPublicKey,
		});

		return properties;
	} catch (error) {
		console.error("Error fetching properties:", error);
		throw error;
	}
};

export const getInvestments = async (
	publicKey: string
): Promise<{
	investmentsData: Investment[];
	invested: number;
	returns: number;
}> => {
	try {
		const response = await axios.post("/list-investments", {
			publicKey,
		});

		const { investmentsData, invested, returns } = response.data;

		return { investmentsData, invested, returns };
	} catch (error) {
		console.error("Error fetching investments:", error);
		throw error;
	}
};

export const fetchInvestmentPDA = async (
	program: Program<CrowdEstate>,
	property: Property,
	wallet: WalletContextState
): Promise<{
	pda: PublicKey | null;
	exists: boolean;
}> => {
	const [investmentPda] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("investment"),
			wallet.publicKey.toBuffer(),
			new PublicKey(property.publicKey).toBuffer(),
		],
		program.programId
	);

	const investmentAccount =
		await program.account.investor.fetchNullable(investmentPda);

	return {
		pda: investmentAccount ? null : investmentPda,
		exists: !!investmentAccount,
	};
};
