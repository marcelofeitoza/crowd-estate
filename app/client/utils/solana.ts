import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
	Transaction,
} from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import * as anchor from "@coral-xyz/anchor";
import {
	createAssociatedTokenAccountInstruction,
	createMint,
	getAssociatedTokenAddress,
	mintTo,
} from "@solana/spl-token";

const PRIVATE_KEY = process.env.NEXT_PUBLIC_ADM;
if (!PRIVATE_KEY) {
	throw new Error("ADM private key is required");
}
const ADM = Uint8Array.from(JSON.parse(PRIVATE_KEY));
const admKeypair = anchor.web3.Keypair.fromSecretKey(ADM);

export const network = WalletAdapterNetwork.Devnet;
export const endpoint = "http://127.0.0.1:8899";
export const connection = new Connection(endpoint, "confirmed");
export const USDC_MINT = new PublicKey(
	"dVHYHTEVz7FW7QctiJJsfYQSSmKS3VVTHVpejHseZom"
);

export interface Property {
	publicKey: string;
	property_name: string;
	total_tokens: number;
	available_tokens: number;
	token_price_usdc: number;
	token_symbol: string;
	admin: string;
	mint: string;
	bump: number;
	dividends_total: number;
	is_closed: boolean;
}

export interface Investment {
	publicKey: string;
	investor: string;
	property: string;
	amount: number;
	dividendsClaimed: number;
}

export const ensureAssociatedTokenAccount = async (
	tx: Transaction,
	mint: PublicKey,
	owner: PublicKey,
	payer: PublicKey,
	allowOwnerOffCurve: boolean = false
) => {
	const ata = await getAssociatedTokenAddress(
		mint,
		owner,
		allowOwnerOffCurve
	);

	const accountInfo = await connection.getAccountInfo(ata);
	if (!accountInfo) {
		if (allowOwnerOffCurve) {
			const propertyUsdcVaultAddress = await getAssociatedTokenAddress(
				mint,
				owner,
				true
			);

			tx.add(
				createAssociatedTokenAccountInstruction(
					payer,
					propertyUsdcVaultAddress,
					owner,
					mint
				)
			);
		} else {
			tx.add(
				createAssociatedTokenAccountInstruction(payer, ata, owner, mint)
			);
		}
	}
	return ata;
};

export const ellipsify = (str: string) => {
	if (str.length > 10) {
		return str.slice(0, 5) + "..." + str.slice(-5);
	}
	return str;
};

export const mintUsdc = async (
	amount: number,
	recipientUsdcAccount: PublicKey
) => {
	const balanceBefore = await connection.getTokenAccountBalance(
		recipientUsdcAccount
	);
	console.log(
		"Recipient USDC Account Balance Before: ",
		balanceBefore.value.uiAmount
	);

	mintTo(
		connection,
		admKeypair,
		USDC_MINT,
		recipientUsdcAccount,
		admKeypair.publicKey,
		amount * 10 ** 6
	);

	const balanceAfter = await connection.getTokenAccountBalance(
		recipientUsdcAccount
	);
	console.log(
		"Recipient USDC Account Balance After: ",
		balanceAfter.value.uiAmount
	);
};

export const setup = async () => {
	await connection.confirmTransaction(
		await connection.requestAirdrop(
			admKeypair.publicKey,
			1_000 * LAMPORTS_PER_SOL
		)
	);

	console.log("Platform pubkey: ", admKeypair.publicKey.toString());

	const usdcMint = await createMint(
		connection,
		admKeypair,
		admKeypair.publicKey,
		null,
		6
	);
	console.log("USDC Mint: ", usdcMint.toBase58());
};
