import { USDC_MINT } from "@/utils/solana";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";

export const checkUsdcAccount = async (
  provider: AnchorProvider,
  publicKey: PublicKey,
): Promise<number> => {
  try {
    const usdcMintInfo = await provider.connection.getAccountInfo(USDC_MINT);
    if (!usdcMintInfo) return;

    const userUsdcAddress = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey,
    );
    const accountInfo =
      await provider.connection.getAccountInfo(userUsdcAddress);

    if (accountInfo) {
      const balance = await provider.connection
        .getTokenAccountBalance(userUsdcAddress)
        .then((balance) => balance.value.uiAmount)
        .catch((error) => {
          // console.error("Error fetching USDC balance:", error);
          return 0;
        });

      return balance;
    } else {
      throw new Error("USDC account not found");
    }
  } catch (error) {
    // console.error("Error checking USDC account:", error);
    throw new Error("Error checking USDC account");
  }
};

export const createUsdcAccount = async (
  provider: AnchorProvider,
  wallet: WalletContextState,
) => {
  try {
    if (!wallet.publicKey || !provider) {
      throw new Error("Wallet not connected or provider unavailable");
    }

    const userUsdcAddress = await getAssociatedTokenAddress(
      USDC_MINT,
      wallet.publicKey,
    );
    const accountInfo =
      await provider.connection.getAccountInfo(userUsdcAddress);
    if (accountInfo) {
      throw new Error("USDC account already exists");
    }

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userUsdcAddress,
        wallet.publicKey,
        USDC_MINT,
      ),
    );
    tx.recentBlockhash = (
      await provider.connection.getLatestBlockhash()
    ).blockhash;
    tx.feePayer = wallet.publicKey;

    const signTx = await wallet.signTransaction(tx);
    provider.connection.sendRawTransaction(signTx.serialize());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Error creating USDC account");
  }
};

export const getUsdcBalance = async (
  provider: AnchorProvider,
  publicKey: PublicKey,
) => {
  try {
    const userUsdcAddress = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey,
    );

    const balance = await provider.connection
      .getTokenAccountBalance(userUsdcAddress)
      .then((balance) => balance.value.uiAmount);

    return balance;
  } catch (error) {
    // console.error("Error fetching USDC balance:", error);
    throw new Error("Error fetching USDC balance");
  }
};
