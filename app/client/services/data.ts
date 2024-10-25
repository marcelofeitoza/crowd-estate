import { CrowdEstate } from "@/idl/types/crowd_estate";
import { Investment, Property } from "@/utils/solana";
import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

let propertiesCache: { lastUpdated: number; properties: Property[] } = {
	lastUpdated: 0,
	properties: [],
};
let investmentsCache: { lastUpdated: number; investments: Investment[] } = {
	lastUpdated: 0,
	investments: [],
};
const CACHE_DURATION = 0.25 * 60 * 1000;

export enum Filters {
	ALL,
	OPEN,
	CLOSED,
	USER,
}

function filter(filters: Filters[] = [], user?: PublicKey) {
	return (property: Property) => {
		if (filters.includes(Filters.ALL)) {
			return true;
		}
		return filters.every((filter) => {
			switch (filter) {
				case Filters.OPEN:
					return !property.is_closed;
				case Filters.CLOSED:
					return property.is_closed;
				case Filters.USER:
					return property.admin === user?.toBase58();
				default:
					return true;
			}
		});
	};
}

export const getProperties = async (
	program: Program<CrowdEstate>,
	filters: Filters[] = [Filters.ALL],
	user?: PublicKey,
	refetch?: boolean
) => {
	const now = Date.now();
	if (!refetch && now - propertiesCache.lastUpdated < CACHE_DURATION) {
		console.log("Returning cached properties");
		return propertiesCache.properties;
	}

	const fetchedProperties = await program.account.property.all();

	const propertiesData = fetchedProperties
		.map((property) => ({
			publicKey: property.publicKey.toBase58(),
			property_name: Buffer.from(
				property.account.propertyName
			).toString(),
			total_tokens: property.account.totalTokens.toNumber(),
			available_tokens: property.account.availableTokens.toNumber(),
			token_price_usdc: property.account.tokenPriceUsdc.toNumber() / 1e6,
			token_symbol: Buffer.from(property.account.tokenSymbol).toString(),
			admin: property.account.admin.toBase58(),
			mint: property.account.mint.toBase58(),
			bump: property.account.bump,
			dividends_total: property.account.dividendsTotal.toNumber() / 1e6,
			is_closed: property.account.isClosed,
		}))
		.filter(filter(filters, user));

	propertiesCache = {
		lastUpdated: now,
		properties: propertiesData,
	};

	return propertiesData;
};

export const getInvestments = async (
	program: Program<CrowdEstate>,
	properties: Property[],
	publicKey: PublicKey,
	refetch?: boolean
): Promise<{
	investmentsData: Investment[];
	invested: number;
	returns: number;
}> => {
	const now = Date.now();
	if (!refetch && now - investmentsCache.lastUpdated < CACHE_DURATION) {
		return calculateInvestmentSummary(
			investmentsCache.investments,
			properties
		);
	}

	const fetchedInvestments = await program.account.investor.all();
	const investmentsData = fetchedInvestments
		.filter((investment) => investment.account.investor.equals(publicKey))
		.map((investment) => ({
			publicKey: investment.publicKey.toBase58(),
			investor: investment.account.investor.toBase58(),
			property: investment.account.property.toBase58(),
			amount: investment.account.tokensOwned.toNumber(),
			dividendsClaimed: investment.account.dividendsClaimed.toNumber(),
		}));

	investmentsCache = {
		lastUpdated: now,
		investments: investmentsData,
	};

	return calculateInvestmentSummary(investmentsData, properties);
};

const calculateInvestmentSummary = (
	investments: Investment[],
	properties: Property[]
): {
	investmentsData: Investment[];
	invested: number;
	returns: number;
} => {
	let invested = 0;
	let returns = 0;

	investments.forEach((investment) => {
		const property = properties.find(
			(p) => p.publicKey === investment.property
		);
		if (property) {
			invested += investment.amount * property.token_price_usdc;
			returns += investment.dividendsClaimed / 1e6;
		}
	});

	return { investmentsData: investments, invested, returns };
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
