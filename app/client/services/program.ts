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
import { createPropertyBackend } from "./user";

export async function createPropertyTransaction(
  provider: AnchorProvider,
  program: Program<CrowdEstate>,
  form: {
    propertyName: string;
    totalTokens: number;
    pricePerToken: number;
    tokenSymbol: string;
  },
  wallet: WalletContextState,
) {
  const adminPublicKey = wallet.publicKey;

  const transaction = new Transaction();
  const instructions = [];

  const [propertyPda, bump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("property"),
      adminPublicKey.toBuffer(),
      Buffer.from(form.propertyName),
    ],
    program.programId,
  );
  console.log("Program ID", program.programId.toBase58());
  console.log("Property PDA", propertyPda.toBase58());

  const propertyMint = Keypair.generate();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: adminPublicKey,
      newAccountPubkey: propertyMint.publicKey,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      propertyMint.publicKey,
      0,
      propertyPda,
      null,
    ),
  );
  console.log("Property Mint", propertyMint.publicKey.toBase58());

  const accounts = {
    admin: adminPublicKey,
    property: propertyPda,
    propertyMint: propertyMint.publicKey,
    usdcMint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };
  console.log("Accounts", accounts);

  const createPropertyInstruction = await program.methods
    .createProperty(
      form.propertyName,
      new anchor.BN(form.totalTokens),
      new anchor.BN(form.pricePerToken * 10 ** 6),
      form.tokenSymbol,
      bump,
    )
    .accountsPartial({
      admin: adminPublicKey,
      propertyMint: propertyMint.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      property: propertyPda,
      propertyVault: await getAssociatedTokenAddress(
        propertyMint.publicKey,
        propertyPda,
        true,
      ),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  console.log("Create Property Instruction", createPropertyInstruction);

  instructions.push(createPropertyInstruction);

  transaction.add(...instructions);
  transaction.recentBlockhash = (
    await provider.connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = adminPublicKey;
  transaction.partialSign(propertyMint);

  console.log("Transaction", {
    feePayer: transaction.feePayer.toBase58(),
    signatures: transaction.signatures.map((s) => s.publicKey.toBase58()),
  });

  const signedTransaction = await wallet.signTransaction(transaction);
  console.log("Transaction signed");

  const txSignature = await provider.connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    },
  );

  await provider.connection.confirmTransaction(txSignature, "confirmed");

  await createPropertyBackend({
    pricePerToken: form.pricePerToken,
    propertyName: form.propertyName,
    propertyPda: propertyPda.toBase58(),
    publicKey: propertyMint.publicKey.toBase58(),
    tokenSymbol: form.tokenSymbol,
    totalTokens: form.totalTokens,
  });

  return { txSignature, propertyPda };
}

export async function investInPropertyTransaction(
  provider: AnchorProvider,
  program: Program<CrowdEstate>,
  property: Property,
  usdcAmount: number,
  wallet: WalletContextState,
) {
  const [investmentPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("investment"),
      wallet.publicKey.toBuffer(),
      new PublicKey(property.publicKey).toBuffer(),
    ],
    program.programId,
  );

  const investmentAccount =
    await program.account.investor.fetchNullable(investmentPda);
  if (investmentAccount) {
    throw new Error("Investment already exists");
  }

  const tx = new Transaction();

  const investorUsdcAta = await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    USDC_MINT,
    wallet.publicKey,
    wallet.publicKey,
  );

  const investorPropertyAta = await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    new PublicKey(property.mint),
    wallet.publicKey,
    wallet.publicKey,
  );

  const propertyUsdcAta = await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    USDC_MINT,
    new PublicKey(property.publicKey),
    wallet.publicKey,
    true,
  );

  const propertyVaultAta = await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    new PublicKey(property.mint),
    new PublicKey(property.publicKey),
    wallet.publicKey,
    true,
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

  const investIx = await program.methods
    .investInProperty(new anchor.BN(usdcAmount * 1e6))
    .accountsStrict(accounts)
    .instruction();
  tx.add(investIx);

  const { blockhash } = await provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signedTx = await wallet.signTransaction(tx);
  const txSignature = await provider.connection.sendRawTransaction(
    signedTx.serialize(),
    {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    },
  );

  await provider.connection.confirmTransaction(txSignature, "confirmed");

  return { txSignature, investment: investmentPda };
}

export async function withdrawInvestment(
  provider: AnchorProvider,
  program: Program<CrowdEstate>,
  investment: Investment,
  propertyData: Property,
  wallet: WalletContextState,
) {
  const investmentPda = investment.publicKey;
  const tx = new Transaction();
  const investorUsdcAta = await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    USDC_MINT,
    wallet.publicKey,
    wallet.publicKey,
  );
  const propertyUsdcAta = await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    USDC_MINT,
    new PublicKey(investment.property),
    wallet.publicKey,
    true,
  );
  const adminPublicKey = wallet.publicKey;
  const adminUsdcAddress = await getAssociatedTokenAddress(
    USDC_MINT,
    adminPublicKey,
  );
  await ensureAssociatedTokenAccount(
    provider.connection,
    tx,
    USDC_MINT,
    adminPublicKey,
    adminPublicKey,
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
    },
  );
  await provider.connection.confirmTransaction(txSignature, "confirmed");

  return { txSignature, investmentPda };
}

export async function distributeDividends(
  provider: AnchorProvider,
  program: Program<CrowdEstate>,
  propertyPda: PublicKey,
  usdcAmount: number,
  wallet: WalletContextState,
) {
  const adminPublicKey = wallet.publicKey;

  const transaction = new Transaction();

  const adminUsdcAddress = await getAssociatedTokenAddress(
    USDC_MINT,
    adminPublicKey,
  );

  await ensureAssociatedTokenAccount(
    provider.connection,
    transaction,
    USDC_MINT,
    adminPublicKey,
    adminPublicKey,
  );

  const accounts = {
    admin: adminPublicKey,
    adminUsdcAccount: adminUsdcAddress,
    property: propertyPda,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };

  const distributeDividendsInstruction = await program.methods
    .distributeDividends(new anchor.BN(usdcAmount * 10 ** 6))
    .accountsPartial(accounts)
    .instruction();

  transaction.add(distributeDividendsInstruction);

  const { blockhash } = await provider.connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = adminPublicKey;

  const signedTransaction = await wallet.signTransaction(transaction);
  const txSignature = await provider.connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    },
  );

  await provider.connection.confirmTransaction(txSignature, "confirmed");

  return { txSignature };
}
