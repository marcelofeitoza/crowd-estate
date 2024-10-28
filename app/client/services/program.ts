import * as anchor from "@coral-xyz/anchor";
import { CrowdEstate } from "@/idl/types/crowd_estate";
import {
	ensureAssociatedTokenAccount,
	Investment,
	Property,
	USDC_MINT,
} from "@/utils/solana";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
	createInitializeMintInstruction,
	getAssociatedTokenAddress,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
	Keypair,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
	createInvestmentBackend,
	createPropertyBackend,
	closePropertyBackend,
	withdrawInvestmentBackend,
	distributeDividendsBackend,
} from "./user";

export async function createPropertyTransaction(
	provider: AnchorProvider,
	program: Program<CrowdEstate>,
	form: {
		propertyName: string;
		totalTokens: number;
		pricePerToken: number;
		tokenSymbol: string;
	},
	wallet: WalletContextState
) {
	const adminPublicKey = wallet.publicKey;

	const transaction = new Transaction();
	const instructions = [];

	const [propertyPda, bump] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("property"),
			adminPublicKey.toBuffer(),
			Buffer.from(form.propertyName),
		],
		program.programId
	);
	// console.log("Program ID", program.programId.toBase58());
	// console.log("Property PDA", propertyPda.toBase58());

	const propertyAccountInfo =
		await provider.connection.getAccountInfo(propertyPda);
	if (propertyAccountInfo) {
		// console.log("Property PDA already exists");

		const propertyData = await program.account.property.fetch(propertyPda);
		// console.log("Property name", propertyData.propertyName.toString());
		if (
			propertyData &&
			propertyData.propertyName.toString() == form.propertyName
		) {
			// console.log("Property PDA is valid, skipping creation");
			return {
				txSignature: null,
				propertyPda,
			};
		} else {
			throw new Error("Property PDA exists but contains invalid data");
		}
	}

	const propertyMint = Keypair.generate();
	instructions.push(
		SystemProgram.createAccount({
			fromPubkey: adminPublicKey,
			newAccountPubkey: propertyMint.publicKey,
			space: 82,
			lamports:
				await provider.connection.getMinimumBalanceForRentExemption(82),
			programId: TOKEN_PROGRAM_ID,
		}),
		createInitializeMintInstruction(
			propertyMint.publicKey,
			0,
			propertyPda,
			null
		)
	);
	// console.log("Property Mint", propertyMint.publicKey.toBase58());

	const createPropertyInstruction = await program.methods
		.createProperty(
			form.propertyName,
			new anchor.BN(form.totalTokens),
			new anchor.BN(form.pricePerToken * 10 ** 6),
			form.tokenSymbol,
			bump
		)
		.accountsPartial({
			admin: adminPublicKey,
			propertyMint: propertyMint.publicKey,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			property: propertyPda,
			propertyVault: await getAssociatedTokenAddress(
				propertyMint.publicKey,
				propertyPda,
				true
			),
			tokenProgram: TOKEN_PROGRAM_ID,
		})
		.instruction();
	// console.log("Create Property Instruction", createPropertyInstruction);

	instructions.push(createPropertyInstruction);

	transaction.add(...instructions);
	transaction.recentBlockhash = (
		await provider.connection.getLatestBlockhash()
	).blockhash;
	transaction.feePayer = adminPublicKey;
	transaction.partialSign(propertyMint);
	const signedTransaction = await wallet.signTransaction(transaction);
	const txSignature = await provider.connection.sendRawTransaction(
		signedTransaction.serialize(),
		{
			skipPreflight: false,
			preflightCommitment: "confirmed",
		}
	);

	await provider.connection
		.confirmTransaction(txSignature, "confirmed")
		.then(async () => {
			await createPropertyBackend({
				propertyPda: propertyPda.toBase58(),
				userPublicKey: adminPublicKey.toBase58(),
				txSignature,
			});
		});

	return {
		txSignature,
		propertyPda,
	};
}

export async function investInPropertyTransaction(
	provider: AnchorProvider,
	program: Program<CrowdEstate>,
	property: Property,
	usdcAmount: number,
	wallet: WalletContextState
) {
	const [investmentPda] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("investment"),
			wallet.publicKey.toBuffer(),
			new PublicKey(property.publicKey).toBuffer(),
		],
		program.programId
	);

	const investmentAccountInfo =
		await provider.connection.getAccountInfo(investmentPda);
	if (investmentAccountInfo) {
		// console.log("Investment PDA already exists");

		const investmentData =
			await program.account.investor.fetch(investmentPda);
		// console.log("Investment PDA data", investmentData);
		if (
			investmentData &&
			investmentData.investor.toBase58() == wallet.publicKey.toBase58()
		) {
			// console.log("Investment PDA is valid, skipping creation");
			return {
				txSignature: null,
				investment: investmentPda,
			};
		} else {
			throw new Error("Investment PDA exists but contains invalid data");
		}
	}

	const tx = new Transaction();

	const investorUsdcAta = await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		USDC_MINT,
		wallet.publicKey,
		wallet.publicKey
	);

	const investorPropertyAta = await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		new PublicKey(property.mint),
		wallet.publicKey,
		wallet.publicKey
	);

	const propertyUsdcAta = await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		USDC_MINT,
		new PublicKey(property.publicKey),
		wallet.publicKey,
		true
	);

	const propertyVaultAta = await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		new PublicKey(property.mint),
		new PublicKey(property.publicKey),
		wallet.publicKey,
		true
	);

	const accounts = {
		property: new PublicKey(property.publicKey),
		propertyMint: new PublicKey(property.mint),
		investor: wallet.publicKey,
		investmentAccount: investmentPda,
		propertyUsdcAccount: propertyUsdcAta,
		investorUsdcAccount: investorUsdcAta,
		investorPropertyTokenAccount: investorPropertyAta,
		propertyVault: propertyVaultAta,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	};

	const usdcAmountBN = new anchor.BN(
		(BigInt(usdcAmount) * BigInt(1e6)).toString()
	);

	// console.log("Invest in property", {
	// 	usdcAmount,
	// 	usdcAmountBN,
	// });
	const investIx = await program.methods
		.investInProperty(usdcAmountBN)
		.accountsStrict(accounts)
		.instruction();
	tx.add(investIx);

	const { blockhash } = await provider.connection.getLatestBlockhash();
	tx.recentBlockhash = blockhash;
	tx.feePayer = wallet.publicKey;

	const signedTx = await wallet.signTransaction(tx);
	const txSignature = await provider.connection.sendRawTransaction(
		signedTx.serialize()
	);

	await provider.connection
		.confirmTransaction(txSignature, "confirmed")
		.then(async () => {
			// console.log("Investment transaction sent", txSignature);
			await createInvestmentBackend({
				investmentPda: investmentPda.toBase58(),
				investorPublicKey: wallet.publicKey.toBase58(),
				propertyPda: property.publicKey,
				txSignature,
			});
		});

	return { txSignature, investment: investmentPda };
}

export async function withdrawInvestment(
	provider: AnchorProvider,
	program: Program<CrowdEstate>,
	investment: Investment,
	propertyData: Property,
	wallet: WalletContextState
): Promise<{ txSignature: string; investmentPda: string }> {
	const investmentPda = investment.publicKey;
	const tx = new Transaction();
	const investorUsdcAta = await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		USDC_MINT,
		wallet.publicKey,
		wallet.publicKey
	);
	const propertyUsdcAta = await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		USDC_MINT,
		new PublicKey(investment.property),
		wallet.publicKey,
		true
	);
	const adminPublicKey = wallet.publicKey;
	const adminUsdcAddress = await getAssociatedTokenAddress(
		USDC_MINT,
		adminPublicKey
	);
	await ensureAssociatedTokenAccount(
		provider.connection,
		tx,
		USDC_MINT,
		adminPublicKey,
		adminPublicKey
	);
	const accounts = {
		property: new PublicKey(investment.property),
		propertyMint: new PublicKey(propertyData.mint),
		investor: wallet.publicKey,
		investmentAccount: investmentPda,
		propertyUsdcAccount: propertyUsdcAta,
		investorUsdcAccount: investorUsdcAta,
		adminUsdcAccount: adminUsdcAddress,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	};
	const withdrawIx = await program.methods
		.withdrawInvestment()
		.accounts(accounts)
		.instruction();
	tx.add(withdrawIx);
	tx.recentBlockhash = (
		await provider.connection.getLatestBlockhash()
	).blockhash;
	tx.feePayer = wallet.publicKey;

	const signedTx = await wallet.signTransaction(tx);
	const txSignature = await provider.connection.sendRawTransaction(
		signedTx.serialize(),
		{
			skipPreflight: false,
			preflightCommitment: "confirmed",
		}
	);
	await provider.connection
		.confirmTransaction(txSignature, "confirmed")
		.then(async () => {
			await withdrawInvestmentBackend({
				investmentPda: investmentPda,
				investorPublicKey: wallet.publicKey.toBase58(),
				propertyPda: investment.property,
				txSignature,
			});
		});

	return { txSignature, investmentPda: investmentPda.toString() };
}

export async function distributeDividendsTransaction(
	provider: AnchorProvider,
	program: Program<CrowdEstate>,
	property: Property,
	amount: number,
	wallet: WalletContextState
) {
	if (!wallet.publicKey) throw new Error("Wallet not connected.");

	const tx = new Transaction();

	const adminUsdcAccount = await getAssociatedTokenAddress(
		USDC_MINT,
		wallet.publicKey
	);

	const accountInfo =
		await provider.connection.getAccountInfo(adminUsdcAccount);
	if (!accountInfo) {
		tx.add(
			createAssociatedTokenAccountInstruction(
				wallet.publicKey,
				adminUsdcAccount,
				wallet.publicKey,
				USDC_MINT
			)
		);
	}

	const propertyUsdcAccount = await getAssociatedTokenAddress(
		USDC_MINT,
		new PublicKey(property.publicKey),
		true
	);

	const accounts = {
		property: new PublicKey(property.publicKey),
		propertyMint: new PublicKey(property.mint),
		admin: wallet.publicKey,
		adminUsdcAccount: adminUsdcAccount,
		tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
		systemProgram: anchor.web3.SystemProgram.programId,
		propertyUsdcAccount: propertyUsdcAccount,
	};

	const distributeDividendsIx = await program.methods
		.distributeDividends(new anchor.BN(amount * 1e6))
		.accounts(accounts)
		.instruction();

	tx.add(distributeDividendsIx);

	tx.recentBlockhash = (
		await provider.connection.getLatestBlockhash()
	).blockhash;
	tx.feePayer = wallet.publicKey;

	const signedTx = await wallet.signTransaction(tx);
	const txSignature = await provider.connection.sendRawTransaction(
		signedTx.serialize(),
		{ skipPreflight: false }
	);

	await provider.connection
		.confirmTransaction(txSignature, "confirmed")
		.then(async () => {
			await distributeDividendsBackend({
				amount,
				propertyPda: property.publicKey,
				userPublicKey: wallet.publicKey.toBase58(),
				txSignature,
			});
		});

	return txSignature;
}

export async function closePropertyTransaction(
	provider: AnchorProvider,
	program: Program<CrowdEstate>,
	property: Property,
	wallet: WalletContextState
) {
	if (!wallet.publicKey) throw new Error("Wallet not connected.");

	const propertyAccountInfo = await provider.connection.getAccountInfo(
		new PublicKey(property.publicKey)
	);
	if (!propertyAccountInfo) {
		// console.log("Property account does not exist");
		return;
	}

	const propertyData = await program.account.property.fetch(
		new PublicKey(property.publicKey)
	);
	if (!propertyData || propertyData.isClosed) {
		// console.log("Property is already closed");
		return;
	}

	const tx = new Transaction();

	const adminUsdcAccount = await getAssociatedTokenAddress(
		USDC_MINT,
		wallet.publicKey
	);

	const accountInfo =
		await provider.connection.getAccountInfo(adminUsdcAccount);
	if (!accountInfo) {
		tx.add(
			createAssociatedTokenAccountInstruction(
				wallet.publicKey,
				adminUsdcAccount,
				wallet.publicKey,
				USDC_MINT
			)
		);
	}

	const propertyVault = await getAssociatedTokenAddress(
		new PublicKey(property.mint),
		new PublicKey(property.publicKey),
		true
	);

	const accounts = {
		property: new PublicKey(property.publicKey),
		propertyMint: new PublicKey(property.mint),
		propertyVault: propertyVault,
		admin: wallet.publicKey,
		adminUsdcAccount: adminUsdcAccount,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: anchor.web3.SystemProgram.programId,
	};

	const closePropertyIx = await program.methods
		.closeProperty()
		.accounts(accounts)
		.instruction();

	tx.add(closePropertyIx);

	tx.recentBlockhash = (
		await provider.connection.getLatestBlockhash()
	).blockhash;
	tx.feePayer = wallet.publicKey;

	const signedTx = await wallet.signTransaction(tx);
	const txSignature = await provider.connection.sendRawTransaction(
		signedTx.serialize(),
		{ skipPreflight: false }
	);

	await provider.connection
		.confirmTransaction(txSignature, "confirmed")
		.then(async () => {
			await closePropertyBackend({
				propertyPda: property.publicKey,
				userPublicKey: wallet.publicKey.toBase58(),
				txSignature,
			});
		});

	return txSignature;
}
