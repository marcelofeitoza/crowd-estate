import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
	Account,
} from "@solana/spl-token";
import { CrowdEstate } from "../target/types/crowd_estate";

/**
 * Setup for creating a property and the associated accounts (admin, mint, USDC).
 */
export async function setupProperty(
	connection: anchor.web3.Connection,
	program: anchor.Program<CrowdEstate>,
	propertyName: string,
	admin: Keypair,
	totalTokens: anchor.BN,
	tokenSymbol: string
) {
	const [propertyPda] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("property"),
			admin.publicKey.toBuffer(),
			Buffer.from(propertyName),
		],
		program.programId
	);

	const propertyMint = await createMint(
		connection,
		admin,
		admin.publicKey,
		null,
		0 // Token decimals
	);

	return { propertyPda, propertyMint };
}

/**
 * Setup for creating USDC mint and associated accounts (admin USDC, investor USDC).
 */
export async function setupUsdcAccounts(
	connection: anchor.web3.Connection,
	admin: Keypair,
	investor: Keypair
) {
	const usdcMint = await createMint(
		connection,
		admin,
		admin.publicKey,
		null,
		6 // USDC typically has 6 decimal places
	);

	const adminUsdcAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		admin,
		usdcMint,
		admin.publicKey
	);

	const investorUsdcAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		admin,
		usdcMint,
		investor.publicKey
	);

	// Mint initial USDC tokens to the admin and investor accounts
	await mintTo(
		connection,
		admin,
		usdcMint,
		adminUsdcAccount.address,
		admin,
		1_000 * 10 ** 6 // Mint 1000 USDC to the admin account
	);

	await mintTo(
		connection,
		admin,
		usdcMint,
		investorUsdcAccount.address,
		admin,
		1_000 * 10 ** 6 // Mint 1000 USDC to the investor account
	);

	return { usdcMint, adminUsdcAccount, investorUsdcAccount };
}

/**
 * Setup for investor property token account.
 */
export async function setupInvestorPropertyAccount(
	connection: anchor.web3.Connection,
	admin: Keypair,
	propertyMint: PublicKey,
	investor: Keypair
) {
	const investorPropertyTokenAccount =
		await getOrCreateAssociatedTokenAccount(
			connection,
			admin,
			propertyMint,
			investor.publicKey
		);

	return investorPropertyTokenAccount;
}

/**
 * General setup function for creating a property, USDC mint, and associated accounts.
 */
export async function setupAccounts(
	connection: anchor.web3.Connection,
	program: anchor.Program<CrowdEstate>
) {
	const admin = Keypair.generate();
	const investor = Keypair.generate();

	// Airdrop SOL to both admin and investor accounts
	const latestBlockhash = await connection.getLatestBlockhash();
	await connection.confirmTransaction({
		signature: await connection.requestAirdrop(
			admin.publicKey,
			5 * anchor.web3.LAMPORTS_PER_SOL
		),
		...latestBlockhash,
	});
	await connection.confirmTransaction({
		signature: await connection.requestAirdrop(
			investor.publicKey,
			5 * anchor.web3.LAMPORTS_PER_SOL
		),
		...latestBlockhash,
	});

	const propertyName = "Test Property";
	const totalTokens = new anchor.BN(100);
	const tokenSymbol = "TST";

	// Setup property and mint
	const { propertyPda, propertyMint } = await setupProperty(
		connection,
		program,
		propertyName,
		admin,
		totalTokens,
		tokenSymbol
	);

	// Setup USDC mint and associated accounts
	const { usdcMint, adminUsdcAccount, investorUsdcAccount } =
		await setupUsdcAccounts(connection, admin, investor);

	// Setup investor's property token account
	const investorPropertyTokenAccount = await setupInvestorPropertyAccount(
		connection,
		admin,
		propertyMint,
		investor
	);

	return {
		admin,
		investor,
		propertyPda,
		propertyMint,
		usdcMint,
		adminUsdcAccount,
		investorUsdcAccount,
		investorPropertyTokenAccount,
	};
}
