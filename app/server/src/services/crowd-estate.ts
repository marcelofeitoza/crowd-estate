import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "../../../../target/types/crowd_estate";
import IDL from "../../../../target/idl/crowd_estate.json";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { Property } from "../models/Property";
import { Filters } from "../controllers/program/listProperties";
import { Investment } from "../models/Investment";
import { redis, RedisKeys } from "./redis";

const admKeypairBytesString = process.env.ADM!;
if (!admKeypairBytesString) {
	throw new Error("Missing ADM");
}
const admKeypairBytes = Uint8Array.from(JSON.parse(admKeypairBytesString));

const endpoint = "https://api.devnet.solana.com";
const connection = new Connection(endpoint);
const walletKeypair = Keypair.fromSecretKey(admKeypairBytes);
const wallet = new Wallet(walletKeypair);
const provider = new anchor.AnchorProvider(connection, wallet);
const program = new anchor.Program<CrowdEstate>(IDL as CrowdEstate, provider);
console.log("programID", program.programId);

export const verifyProperty = async (
	propertyPda: string
): Promise<Property> => {
	const property = await getProperty(propertyPda);
	return property;
};

export const getProperties = async (
	filters: Filters[] = [Filters.ALL],
	userPublicKey?: string,
	forceRefresh: boolean = false
): Promise<Property[]> => {
	const cacheKey = RedisKeys.PropertiesAll;
	let propertiesData: Property[];

	if (!forceRefresh) {
		const cachedProperties = await redis.get(cacheKey);
		if (cachedProperties) {
			console.log(`[getProperties] Cache hit for key: ${cacheKey}`);
			propertiesData = JSON.parse(cachedProperties);
		} else {
			console.log(
				`[getProperties] Cache miss for key: ${cacheKey}. Fetching from blockchain.`
			);
			const fetchedProperties = await program.account.property.all();

			propertiesData = fetchedProperties.map((property) => ({
				publicKey: property.publicKey.toBase58(),
				property_name: Buffer.from(property.account.propertyName)
					.toString()
					.trim(),
				total_tokens: property.account.totalTokens.toNumber(),
				available_tokens: property.account.availableTokens.toNumber(),
				token_price_usdc:
					property.account.tokenPriceUsdc.toNumber() / 1e6,
				token_symbol: Buffer.from(property.account.tokenSymbol)
					.toString()
					.trim(),
				admin: property.account.admin.toBase58(),
				mint: property.account.mint.toBase58(),
				bump: property.account.bump,
				dividends_total:
					property.account.dividendsTotal.toNumber() / 1e6,
				is_closed: property.account.isClosed,
			}));

			await redis.set(cacheKey, JSON.stringify(propertiesData));
			console.log(`[getProperties] Cache set for key: ${cacheKey}`);
		}
	} else {
		console.log(
			`[getProperties] forceRefresh=true. Fetching properties from blockchain.`
		);
		const fetchedProperties = await program.account.property.all();

		propertiesData = fetchedProperties.map((property) => ({
			publicKey: property.publicKey.toBase58(),
			property_name: Buffer.from(property.account.propertyName)
				.toString()
				.trim(),
			total_tokens: property.account.totalTokens.toNumber(),
			available_tokens: property.account.availableTokens.toNumber(),
			token_price_usdc: property.account.tokenPriceUsdc.toNumber() / 1e6,
			token_symbol: Buffer.from(property.account.tokenSymbol)
				.toString()
				.trim(),
			admin: property.account.admin.toBase58(),
			mint: property.account.mint.toBase58(),
			bump: property.account.bump,
			dividends_total: property.account.dividendsTotal.toNumber() / 1e6,
			is_closed: property.account.isClosed,
		}));

		await redis.set(cacheKey, JSON.stringify(propertiesData));
		console.log(`[getProperties] Cache updated for key: ${cacheKey}`);
	}

	const filteredProperties = propertiesData.filter((property) => {
		for (const filter of filters) {
			if (filter === Filters.ALL) {
				return true;
			} else if (filter === Filters.OPEN && property.is_closed) {
				return false;
			} else if (filter === Filters.CLOSED && !property.is_closed) {
				return false;
			} else if (
				filter === Filters.USER &&
				property.admin !== userPublicKey
			) {
				return false;
			}
		}
		return true;
	});

	return filteredProperties;
};

export const getProperty = async (propertyPda: string): Promise<Property> => {
	const cacheKey = `property:${propertyPda}`;
	const cachedProperty = await redis.get(cacheKey);
	if (cachedProperty) {
		return JSON.parse(cachedProperty);
	}

	const propertyAccount = await program.account.property.fetchNullable(
		propertyPda
	);

	if (!propertyAccount) {
		throw { code: 404, message: `Property ${propertyPda} not found` };
	}

	const property: Property = {
		publicKey: propertyPda,
		property_name: Buffer.from(propertyAccount.propertyName)
			.toString()
			.trim(),
		total_tokens: propertyAccount.totalTokens.toNumber(),
		available_tokens: propertyAccount.availableTokens.toNumber(),
		token_price_usdc: propertyAccount.tokenPriceUsdc.toNumber() / 1e6,
		token_symbol: Buffer.from(propertyAccount.tokenSymbol)
			.toString()
			.trim(),
		admin: propertyAccount.admin.toBase58(),
		mint: propertyAccount.mint.toBase58(),
		bump: propertyAccount.bump,
		dividends_total: propertyAccount.dividendsTotal.toNumber() / 1e6,
		is_closed: propertyAccount.isClosed,
	};

	await redis.set(cacheKey, JSON.stringify(property));

	return property;
};

export const getPropertiesByPDAs = async (
	propertyPDAs: string[]
): Promise<Property[]> => {
	const properties: Property[] = [];

	for (const pda of propertyPDAs) {
		const property = await getProperty(pda);
		properties.push(property);
	}

	return properties;
};

export const getInvestmentsByInvestor = async (
	investorPublicKey: string
): Promise<Investment[]> => {
	const cacheKey = `investments:${investorPublicKey}`;
	const cachedInvestments = await redis.get(cacheKey);
	if (cachedInvestments) {
		console.log("Returning investments from cache");
		return JSON.parse(cachedInvestments);
	}

	console.log("Fetching investments from blockchain");
	const fetchedInvestments = await program.account.investor.all([
		{
			memcmp: {
				offset: 8,
				bytes: investorPublicKey,
			},
		},
	]);

	const investments: Investment[] = fetchedInvestments.map((investment) => ({
		publicKey: investment.publicKey.toBase58(),
		property: investment.account.property.toBase58(),
		amount: investment.account.tokensOwned.toNumber(),
		dividendsClaimed: investment.account.dividendsClaimed.toNumber(),
		investor: investment.account.investor.toBase58(),
	}));

	await redis.set(cacheKey, JSON.stringify(investments));

	return investments;
};

export const getInvestment = async (
	investmentPda: string
): Promise<Investment | null> => {
	const investmentAccount = await program.account.investor.fetchNullable(
		investmentPda
	);

	if (!investmentAccount) {
		return null;
	}

	const investment: Investment = {
		publicKey: investmentPda,
		property: investmentAccount.property.toBase58(),
		amount: investmentAccount.tokensOwned.toNumber(),
		dividendsClaimed: investmentAccount.dividendsClaimed.toNumber(),
		investor: investmentAccount.investor.toBase58(),
	};

	return investment;
};

export { program, provider };
