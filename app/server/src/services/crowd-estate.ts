import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "../../../../target/types/crowd_estate";
import IDL from "../../../../target/idl/crowd_estate.json";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { Property } from "../models/Property";
import { Filters } from "../controllers/program/listProperties";

const admKeypairBytesString = process.env.ADM!;
if (!admKeypairBytesString) {
	throw new Error("Missing ADM");
}
const admKeypairBytes = Uint8Array.from(JSON.parse(admKeypairBytesString));

const endpoint = "https://api.devnet.solana.com";
const connection = new Connection(endpoint);
const walletKeypair = Keypair.fromSecretKey(admKeypairBytes);
const wallet = new Wallet(walletKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {
	preflightCommitment: "processed",
});
const program = new anchor.Program<CrowdEstate>(IDL as CrowdEstate, provider);

export const verifyProperty = async (
	propertyPda: string
): Promise<Property> => {
	const property = await getProperty(propertyPda);
	return property;
};

export const getProperties = async (
	filters: Filters[] = [Filters.ALL],
	userPublicKey?: string
): Promise<Property[]> => {
	const fetchedProperties = await program.account.property.all();
	console.log(fetchedProperties);

	let propertiesData: Property[] = fetchedProperties.map((property) => ({
		name: Buffer.from(property.account.propertyName).toString().trim(),
		total_tokens: property.account.totalTokens.toNumber(),
		available_tokens: property.account.availableTokens.toNumber(),
		price_per_token: property.account.tokenPriceUsdc.toNumber() / 1e6,
		token_symbol: Buffer.from(property.account.tokenSymbol)
			.toString()
			.trim(),
		property_pda: property.publicKey.toBase58(),
		creator_public_key: property.account.admin.toBase58(),
		is_closed: property.account.isClosed,
	}));

	propertiesData = propertiesData.filter((property) => {
		for (const filter of filters) {
			if (filter === Filters.ALL) {
				return true;
			} else if (filter === Filters.OPEN && property.is_closed) {
				return false;
			} else if (filter === Filters.CLOSED && !property.is_closed) {
				return false;
			} else if (
				filter === Filters.USER &&
				property.creator_public_key !== userPublicKey
			) {
				return false;
			}
		}
		return true;
	});

	return propertiesData;
};

export const getProperty = async (propertyPda: string): Promise<Property> => {
	const propertyAccount = await program.account.property.fetchNullable(
		propertyPda
	);

	if (!propertyAccount) {
		throw { code: 404, message: `Property ${propertyPda} not found` };
	}

	const property: Property = {
		name: Buffer.from(propertyAccount.propertyName).toString().trim(),
		total_tokens: propertyAccount.totalTokens.toNumber(),
		price_per_token: propertyAccount.tokenPriceUsdc.toNumber() / 1e6,
		token_symbol: Buffer.from(propertyAccount.tokenSymbol)
			.toString()
			.trim(),
		property_pda: propertyPda,
		available_tokens: propertyAccount.availableTokens.toNumber(),
		creator_public_key: propertyAccount.admin.toBase58(),
		is_closed: propertyAccount.isClosed,
	};

	return property;
};

export { program, provider };
