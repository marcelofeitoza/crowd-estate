import { axios } from "@/utils/axios";
import { Investment, Property } from "@/utils/solana";
import { PublicKey } from "@solana/web3.js";

export enum Filters {
	ALL = "ALL",
	OPEN = "OPEN",
	CLOSED = "CLOSED",
	USER = "USER",
}

interface GetPropertiesArgs {
	userPublicKey?: string;
	filters?: Filters[];
	forceRefresh?: boolean;
}

export const getProperties = async ({
	userPublicKey,
	filters = [Filters.ALL],
	forceRefresh = false,
}: GetPropertiesArgs): Promise<Property[]> => {
	try {
		const response = await axios.post("/program/properties", {
			filters,
			userPublicKey,
			forceRefresh,
		});

		const properties: Property[] = response.data.properties;

		return properties;
	} catch (error) {
		console.error("Error fetching properties:", error);
		throw error;
	}
};

export const getProperty = async (propertyPda: string): Promise<Property> => {
	try {
		const response = await axios.get(`/program/properties/${propertyPda}`);

		const property: Property = response.data.property;

		return property;
	} catch (error) {
		console.error("Error fetching properties:", error);
		throw error;
	}
};

interface GetInvestmentsArgs {
	publicKey: string;
	forceRefresh?: boolean;
}

interface GetInvestmentsResponse {
	investmentsData: Investment[];
	invested: number;
	returns: number;
	properties: Property[];
}

export const getInvestments = async ({
	publicKey,
	forceRefresh = false,
}: GetInvestmentsArgs): Promise<GetInvestmentsResponse> => {
	try {
		const response = await axios.post("/program/investments", {
			publicKey,
			forceRefresh,
		});

		const { investmentsData, invested, returns, properties } =
			response.data;

		return { investmentsData, invested, returns, properties };
	} catch (error) {
		console.error("Error fetching investments:", error);
		throw error;
	}
};

export const getInvestment = async (
	investmentPda: string
): Promise<Investment> => {
	try {
		const response = await axios.get(
			`/program/investments/${investmentPda}`
		);

		const investment: Investment = response.data.investment;

		return investment;
	} catch (error) {
		console.error("Error fetching investments:", error);
		throw error;
	}
};

export const fetchInvestmentPDA = async (
	programId: PublicKey,
	userPublicKey: string,
	propertyPda: string
): Promise<{
	pda: PublicKey | null;
	exists: boolean;
}> => {
	if (!userPublicKey || !propertyPda) {
		return {
			pda: null,
			exists: false,
		};
	}

	console.log("userPublicKey", userPublicKey);
	console.log("propertyPda", propertyPda);
	console.log("programId", programId.toBase58());

	const [investmentPda] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("investment"),
			Buffer.from(userPublicKey),
			new PublicKey(propertyPda).toBuffer(),
		],
		programId
	);

	const investment = await getInvestment(investmentPda.toBase58());

	return {
		pda: investmentPda,
		exists: !!investment,
	};
};
