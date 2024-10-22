import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "../../../../target/types/crowd_estate";
import IDL from "../../../../target/idl/crowd_estate.json";
import {
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { decryptPrivateKey } from "../utils/walletUtils";
import { RPC_URL, USDC_MINT } from "../utils/constants";
import { mintUsdc } from "../utils/mint";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

export const connection = new Connection(RPC_URL, "confirmed");

export const executeCreatePropertyTransaction = async (
	user,
	propertyName: string,
	totalTokens: number,
	pricePerToken: number,
	propertySymbol: string
): Promise<string> => {
	try {
		const userKeypair = Keypair.fromSecretKey(
			decryptPrivateKey(user.encrypted_private_key)
		);
		console.log("User Keypair: ", userKeypair);

		const provider = new AnchorProvider(
			connection,
			new anchor.Wallet(userKeypair),
			{
				preflightCommitment: "confirmed",
			}
		);
		const program = new Program<CrowdEstate>(IDL as any, provider);

		const [propertyPda, bump] = await PublicKey.findProgramAddress(
			[
				Buffer.from("property"),
				userKeypair.publicKey.toBuffer(),
				Buffer.from(propertyName),
			],
			program.programId
		);
		console.log("Property PDA: ", propertyPda.toString(), " Bump: ", bump);

		const propertyMint = await createMint(
			connection,
			userKeypair,
			propertyPda,
			null,
			0
		);
		console.log("Property Mint: ", propertyMint);

		const tx = await program.methods
			.createProperty(
				propertyName,
				new anchor.BN(totalTokens),
				new anchor.BN(pricePerToken),
				propertySymbol,
				bump
			)
			.accounts({
				admin: userKeypair.publicKey,
				propertyMint: propertyMint,
			})
			.signers([userKeypair])
			.rpc();
		console.log("Transaction: ", tx);

		return propertyPda.toString();
	} catch (error: any) {
		throw new Error(`Failed to create property: ${error.message}`);
	}
};

export const executeInvestInPropertyTransaction = async (
	investor,
	admin,
	propertyPdaString,
	usdcAmount
) => {
	try {
		console.log("executeInvestInPropertyTransaction: ", {
			investor,
			admin,
			propertyPdaString,
			usdcAmount,
		});

		// Certifique-se de que propertyPdaString é um objeto com a chave 'pubkey'
		const propertyPda = new PublicKey(propertyPdaString.pubkey);
		console.log("Property PDA: ", propertyPda.toString());

		const investorKeypair = Keypair.fromSecretKey(
			decryptPrivateKey(investor.encrypted_private_key)
		);
		console.log("Investor Keypair: ", investorKeypair.publicKey.toString());

		const adminKeypair = Keypair.fromSecretKey(
			decryptPrivateKey(admin.encrypted_private_key)
		);
		console.log("Admin Keypair: ", adminKeypair.publicKey.toString());

		console.log("Starting transaction...");

		const provider = new AnchorProvider(
			connection,
			new anchor.Wallet(investorKeypair),
			{
				preflightCommitment: "confirmed",
			}
		);
		const program = new Program<CrowdEstate>(IDL as any, provider);

		const propertyAccount = await program.account.property.fetch(
			propertyPda
		);
		console.log("Property Account: ", propertyAccount);

		const propertyMint = propertyAccount.mint;
		console.log("Property Mint: ", propertyMint.toString());

		const propertyUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			adminKeypair,
			USDC_MINT,
			propertyPda,
			true
		);
		console.log(
			"Property USDC Account: ",
			propertyUsdcAccount.address.toString()
		);

		const [investmentAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("investment"),
				investorKeypair.publicKey.toBuffer(),
				propertyPda.toBuffer(),
			],
			program.programId
		);
		console.log("Investment Account: ", investmentAccount.toString());

		const investorUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			investorKeypair,
			USDC_MINT,
			investorKeypair.publicKey
		);
		console.log(
			"Investor USDC Account: ",
			investorUsdcAccount.address.toString()
		);
		await mintUsdc(usdcAmount, investorUsdcAccount.address, true);

		const investorPropertyTokenAccount =
			await getOrCreateAssociatedTokenAccount(
				connection,
				investorKeypair,
				propertyMint,
				investorKeypair.publicKey
			);
		console.log(
			"Investor Property Token Account: ",
			investorPropertyTokenAccount.address.toString()
		);

		const platformKeypair = JSON.parse(process.env.ADM!);
		const platform = Keypair.fromSecretKey(
			Uint8Array.from(platformKeypair)
		);
		await mintTo(
			connection,
			platform,
			new PublicKey(USDC_MINT),
			investorUsdcAccount.address,
			platform,
			usdcAmount * 10 ** 6
		);

		const propertyVault = await getOrCreateAssociatedTokenAccount(
			connection,
			adminKeypair,
			propertyMint,
			propertyPda,
			true
		);
		console.log("Property Vault: ", propertyVault.address.toString());

		console.log("Accounts being passed to the transaction:", {
			propertyPda: propertyPda.toString(),
			investor: investorKeypair.publicKey.toString(),
			admin: adminKeypair.publicKey.toString(),
			investorUsdcAccount: investorUsdcAccount.address.toString(),
			investmentAccount: investmentAccount.toString(),
			propertyMint: propertyMint.toString(),
			propertyUsdcAccount: propertyUsdcAccount.address.toString(),
			investorPropertyTokenAccount:
				investorPropertyTokenAccount.address.toString(),
			propertyVault: propertyVault.address.toString(),
			systemProgram: SYSTEM_PROGRAM_ID.toString(),
			tokenProgram: TOKEN_PROGRAM_ID.toString(),
		});

		console.log(
			"Balance of investor USDC account: ",
			await connection.getTokenAccountBalance(
				investorUsdcAccount.address
			),
			"Needed amount: ",
			propertyAccount.tokenPriceUsdc.toNumber() * usdcAmount
		);

		const tx = await program.methods
			.investInProperty(new anchor.BN(usdcAmount * 10 ** 6))
			.accountsPartial({
				property: propertyPda,
				investor: investorKeypair.publicKey,
				admin: adminKeypair.publicKey,
				investorUsdcAccount: investorUsdcAccount.address,
				investmentAccount: investmentAccount,
				propertyMint: propertyMint,
				propertyUsdcAccount: propertyUsdcAccount.address,
				investorPropertyTokenAccount:
					investorPropertyTokenAccount.address,
				propertyVault: propertyVault.address,
				systemProgram: SYSTEM_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
			})
			.signers([investorKeypair, adminKeypair])
			.rpc();

		console.log("Transaction successful: ", tx);

		return investmentAccount.toString();
	} catch (error) {
		console.error("Transaction failed: ", error);
		throw new Error(`Failed to execute investment: ${error.message}`);
	}
};

export const fetchInvestmentAccount = async (
	investmentPda: PublicKey,
	investment
) => {
	try {
		const investorKeypair = Keypair.fromSecretKey(
			decryptPrivateKey(investment.encrypted_private_key)
		);
		console.log("Investor Keypair: ", investorKeypair);

		const provider = new AnchorProvider(
			connection,
			new anchor.Wallet(investorKeypair),
			{
				preflightCommitment: "confirmed",
			}
		);
		const program = new Program<CrowdEstate>(IDL as any, provider);

		const investmentAccount = await program.account.investor.fetch(
			investmentPda
		);

		const property = await program.account.property.fetch(
			investmentAccount.property
		);

		return {
			investment: parseInvestorAccount(investmentAccount),
			property: parsePropertyAccount(property),
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch investment account data for PDA ${investmentPda.toString()}: ${
				error.message
			}`
		);
	}
};

export const getInvestmentAccountData = async (
	investmentPda: PublicKey,
	investment,
	investor
) => {
	try {
		const investorKeypair = Keypair.fromSecretKey(
			decryptPrivateKey(investor.encrypted_private_key)
		);

		const provider = new AnchorProvider(
			connection,
			new anchor.Wallet(investorKeypair),
			{
				preflightCommitment: "confirmed",
			}
		);
		const program = new Program<CrowdEstate>(IDL as any, provider);

		const investmentAccount = await program.account.investor.fetch(
			investmentPda
		);

		const propertyAccount = await program.account.property.fetch(
			investmentAccount.property
		);

		const parsedInvestment = parseInvestorAccount(investmentAccount);
		const parsedProperty = parsePropertyAccount(propertyAccount);

		return {
			investment: parsedInvestment,
			property: parsedProperty,
		};
	} catch (error) {
		console.error(
			`Failed to fetch investment account data for PDA ${investmentPda.toString()}: `,
			error
		);
		return null;
	}
};

// export const executeInvestInPropertyTransaction = async (
// 	investor,
// 	admin,
// 	propertyPdaString,
// 	usdcAmount
// ) => {
// 	try {
// 		console.log("executeInvestInPropertyTransaction: ", {
// 			investor,
// 			admin,
// 			propertyPdaString,
// 			usdcAmount,
// 		});

// 		const propertyPda = new PublicKey(propertyPdaString.pubkey);
// 		console.log("Property PDA: ", propertyPda.toString());

// 		const investorKeypair = Keypair.fromSecretKey(
// 			decryptPrivateKey(investor.encrypted_private_key)
// 		);
// 		console.log("Investor Keypair: ", investorKeypair);

// 		const adminKeypair = Keypair.fromSecretKey(
// 			decryptPrivateKey(admin.encrypted_private_key)
// 		);
// 		console.log("Admin Keypair: ", adminKeypair);

// 		console.log("Starting transaction...");

// 		const provider = new AnchorProvider(
// 			connection,
// 			new anchor.Wallet(investorKeypair),
// 			{
// 				preflightCommitment: "confirmed",
// 			}
// 		);
// 		const program = new Program<CrowdEstate>(IDL as any, provider);

// 		const propertyAccount = await program.account.property.fetch(
// 			propertyPda
// 		);
// 		console.log("Property Account: ", propertyAccount);

// 		const propertyMint = propertyAccount.mint;
// 		console.log("Property Mint: ", propertyMint.toString());

// 		const propertyUsdcAccount = await getOrCreateAssociatedTokenAccount(
// 			connection,
// 			adminKeypair,
// 			new PublicKey(USDC_MINT),
// 			propertyPda,
// 			true
// 		);
// 		console.log("Property USDC Account: ", propertyUsdcAccount.address);

// 		const [investmentAccount] = PublicKey.findProgramAddressSync(
// 			[
// 				Buffer.from("investment"),
// 				investorKeypair.publicKey.toBuffer(),
// 				propertyPda.toBuffer(),
// 			],
// 			program.programId
// 		);
// 		console.log("Investment Account: ", investmentAccount.toString());

// 		const investorUsdcAccount = await getOrCreateAssociatedTokenAccount(
// 			connection,
// 			investorKeypair,
// 			new PublicKey(USDC_MINT),
// 			investorKeypair.publicKey
// 		);
// 		console.log(
// 			"Investor USDC Account: ",
// 			investorUsdcAccount.address.toString()
// 		);
// 		mintUsdc(usdcAmount, investorUsdcAccount.address, true);

// 		const investorPropertyTokenAccount =
// 			await getOrCreateAssociatedTokenAccount(
// 				connection,
// 				investorKeypair,
// 				propertyMint,
// 				investorKeypair.publicKey
// 			);
// 		console.log(
// 			"Investor Property Token Account: ",
// 			investorPropertyTokenAccount.address.toString()
// 		);

// 		const propertyVault = await getOrCreateAssociatedTokenAccount(
// 			connection,
// 			adminKeypair,
// 			propertyMint,
// 			propertyPda,
// 			true
// 		);
// 		console.log("Property Vault: ", propertyVault.toString());

// 		console.log("Accounts being passed to the transaction:", {
// 			propertyPda: propertyPda.toString(),
// 			investor: investorKeypair.publicKey.toString(),
// 			admin: adminKeypair.publicKey.toString(),
// 			investorUsdcAccount: investorUsdcAccount.address.toString(),
// 			investmentAccount: investmentAccount.toString(),
// 			propertyMint: propertyMint.toString(),
// 			propertyUsdcAccount: propertyUsdcAccount.address,
// 		});

// 		console.log(
// 			"Balance of investor USDC account: ",
// 			await connection.getTokenAccountBalance(
// 				investorUsdcAccount.address
// 			),
// 			"Needed amount: ",
// 			propertyAccount.tokenPriceUsdc.toNumber() * usdcAmount
// 		);

// 		const platformKeypair = JSON.parse(process.env.ADM!);
// 		const platform = Keypair.fromSecretKey(
// 			Uint8Array.from(platformKeypair)
// 		);
// 		await mintTo(
// 			connection,
// 			platform,
// 			new PublicKey(USDC_MINT),
// 			investorUsdcAccount.address,
// 			platform,
// 			usdcAmount * 10 ** 6
// 		);

// 		const tx = await program.methods
// 			.investInProperty(new anchor.BN(usdcAmount * 10 ** 6))
// 			.accountsPartial({
// 				property: propertyPda,
// 				investor: investorKeypair.publicKey,
// 				admin: adminKeypair.publicKey,
// 				investorUsdcAccount: investorUsdcAccount.address,
// 				investmentAccount: investmentAccount,
// 				propertyMint: propertyMint,
// 				propertyUsdcAccount: propertyUsdcAccount.address,
// 				investorPropertyTokenAccount:
// 					investorPropertyTokenAccount.address,
// 				propertyVault: propertyVault.address,
// 				systemProgram: SYSTEM_PROGRAM_ID,
// 				tokenProgram: TOKEN_PROGRAM_ID,
// 			})
// 			.signers([investorKeypair, adminKeypair])
// 			.rpc();

// 		console.log("Transaction successful: ", tx);

// 		return tx;
// 	} catch (error) {
// 		console.error("Transaction failed: ", error);
// 		throw new Error(`Failed to execute investment: ${error.message}`);
// 	}
// };

const parsePropertyAccount = (propertyAccount) => {
	return {
		propertyName: new TextDecoder().decode(propertyAccount.propertyName),
		totalTokens: Number(propertyAccount.totalTokens),
		availableTokens: Number(propertyAccount.availableTokens),
		tokenPriceUsdc: Number(propertyAccount.tokenPriceUsdc),
		tokenSymbol: new TextDecoder().decode(propertyAccount.tokenSymbol),
		admin: propertyAccount.admin.toString(),
		mint: propertyAccount.mint.toString(),
		bump: propertyAccount.bump,
		dividendsTotal: Number(propertyAccount.dividendsTotal),
		isClosed: propertyAccount.isClosed,
	};
};

const parseInvestorAccount = (investmentAccount) => {
	return {
		investor: investmentAccount.investor.toString(),
		property: investmentAccount.property.toString(),
		tokensOwned: Number(investmentAccount.tokensOwned),
		dividendsClaimed: Number(investmentAccount.dividendsClaimed),
	};
};
