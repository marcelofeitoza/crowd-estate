"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  ensureAssociatedTokenAccount,
  mintUsdc,
  Property,
  USDC_MINT,
} from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Coins, DollarSign, PieChart } from "lucide-react";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useAnchor } from "@/hooks/use-anchor";

interface InvestModalProps {
  property: Property;
  onInvestmentSuccess: () => void;
}

export const InvestModal = ({
  property,
  onInvestmentSuccess,
}: InvestModalProps) => {
  const { program, provider } = useAnchor();
  const wallet = useWallet();
  const [usdcAmount, setUsdcAmount] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [usdcAccountExists, setUsdcAccountExists] = useState<boolean>(true);
  const [walletUsdcBalance, setWalletUsdcBalance] = useState<number>(0);
  const maxInvestmentUSDC =
    property.available_tokens * property.token_price_usdc;
  const tokenPriceUSDC = property.token_price_usdc;

  useEffect(() => {
    const checkUsdcAccount = async () => {
      try {
        const usdcMintInfo =
          await provider.connection.getAccountInfo(USDC_MINT);
        if (!usdcMintInfo) return;

        const userUsdcAddress = await getAssociatedTokenAddress(
          USDC_MINT,
          wallet.publicKey,
        );
        const accountInfo =
          await provider.connection.getAccountInfo(userUsdcAddress);

        if (accountInfo) {
          const balance = await provider.connection
            .getTokenAccountBalance(userUsdcAddress)
            .then((balance) => balance.value.uiAmount)
            .catch((error) => {
              console.error("Error fetching USDC balance:", error);
              return 0;
            });
          setWalletUsdcBalance(balance);
        } else {
          setUsdcAccountExists(false);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setUsdcAccountExists(false);
      }
    };

    if (wallet.publicKey) {
      checkUsdcAccount();
    }
  }, [provider, wallet]);

  const handleUsdcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsdcAmount = Number(e.target.value);
    if (newUsdcAmount % tokenPriceUSDC !== 0) {
      const adjustedUsdc =
        Math.floor(newUsdcAmount / tokenPriceUSDC) * tokenPriceUSDC;
      setUsdcAmount(adjustedUsdc);
      setTokenAmount(adjustedUsdc / tokenPriceUSDC);
    } else {
      setUsdcAmount(newUsdcAmount);
      setTokenAmount(newUsdcAmount / tokenPriceUSDC);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTokenAmount = Number(e.target.value);
    const newUsdcAmount = newTokenAmount * tokenPriceUSDC;
    setTokenAmount(newTokenAmount);
    setUsdcAmount(newUsdcAmount);
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey || !program) {
      toast({
        title: "Error",
        description: "Connect your Solana wallet.",
        variant: "destructive",
      });
      return;
    }

    if (usdcAmount <= 0) {
      toast({
        title: "Error",
        description: "Enter a valid amount to invest.",
        variant: "destructive",
      });
      return;
    }

    if (usdcAmount > maxInvestmentUSDC) {
      toast({
        title: "Error",
        description: `The maximum amount you can invest is $${maxInvestmentUSDC.toFixed(2)} USDC.`,
        variant: "destructive",
      });
      return;
    }

    if (usdcAmount > walletUsdcBalance) {
      toast({
        title: "Error",
        description: "Insufficient USDC balance for this investment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

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
        toast({
          title: "Error",
          description:
            "You have already invested in this property. Withdraw your previous investment and try again.",
          variant: "default",
        });
        setIsSubmitting(false);
        return;
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

      toast({
        title: "Success",
        description: "Investment successful: " + txSignature,
        variant: "default",
      });

      setWalletUsdcBalance(walletUsdcBalance - usdcAmount);
      setIsSubmitting(false);
      setIsOpen(false);
      onInvestmentSuccess();
    } catch (error) {
      if (error instanceof SendTransactionError) {
        console.error(
          "Error sending transaction:",
          await error.getLogs(provider.connection),
        );
      } else {
        console.error("Error investing:", error);
      }
      toast({
        title: "Error",
        description: "Investment failed. Check the console.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUsdcAccount = async () => {
    try {
      if (!wallet.publicKey || !provider) {
        toast({
          title: "Error",
          description: "Wallet not connected or provider unavailable.",
          variant: "destructive",
        });
        return;
      }

      const userUsdcAddress = await getAssociatedTokenAddress(
        USDC_MINT,
        wallet.publicKey,
      );
      const accountInfo =
        await provider.connection.getAccountInfo(userUsdcAddress);
      if (accountInfo) {
        toast({
          title: "Info",
          description: "USDC account already exists.",
          variant: "default",
        });
        setUsdcAccountExists(true);
        return;
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
      const signature = await provider.connection.sendRawTransaction(
        signTx.serialize(),
      );

      toast({
        title: "Success",
        description: "USDC account created successfully: " + signature,
        variant: "default",
      });

      setUsdcAccountExists(true);
    } catch (error) {
      console.error("Error creating USDC account:", error);
      toast({
        title: "Error",
        description: "Failed to create USDC account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [isMinting, setIsMinting] = useState<boolean>(false);

  const handleMintUsdc = async () => {
    try {
      setIsMinting(true);
      const usdcAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        wallet.publicKey,
      );
      await mintUsdc(provider.connection, 1000, usdcAccount);
      const balance = await provider.connection
        .getTokenAccountBalance(usdcAccount)
        .then((balance) => balance.value.uiAmount)
        .catch((error) => {
          console.error("Error fetching USDC balance:", error);
          return 0;
        });
      setWalletUsdcBalance(balance);
    } catch (error) {
      console.error("Error minting USDC:", error);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={property.is_closed}>
          Invest Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invest in {property.property_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Available Tokens</span>
              <span>
                {property.available_tokens} / {property.total_tokens}
              </span>
            </div>
            <Progress
              value={(property.available_tokens / property.total_tokens) * 100}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Token Price</p>
                <p className="text-lg">
                  ${property.token_price_usdc.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Coins className="w-4 h-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Token Symbol</p>
                <p className="text-lg">{property.token_symbol}</p>
              </div>
            </div>
            <div className="flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Dividends</p>
                <p className="text-lg">
                  ${property.dividends_total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleInvest} className="space-y-4 mt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="usdcAmount">Amount to Invest (USDC)</Label>
              <Input
                id="usdcAmount"
                type="number"
                step={tokenPriceUSDC}
                min="0"
                max={Math.min(maxInvestmentUSDC, walletUsdcBalance)}
                value={usdcAmount}
                onChange={handleUsdcChange}
                placeholder={`$0.00 - Max: $${Math.min(maxInvestmentUSDC, walletUsdcBalance).toFixed(2)}`}
                required
              />
            </div>

            <div className="flex-1">
              <Label htmlFor="tokenAmount">Token Amount</Label>
              <Input
                id="tokenAmount"
                type="number"
                step="1"
                min="0"
                max={property.available_tokens}
                value={tokenAmount}
                onChange={handleTokenChange}
                placeholder={`0 - Max: ${property.available_tokens} tokens`}
                required
              />
            </div>
          </div>

          {!usdcAccountExists ? (
            <div className="mb-6">
              <Button variant="default" onClick={handleCreateUsdcAccount}>
                Create USDC Account
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              USDC Balance: {walletUsdcBalance.toFixed(2)}{" "}
              <Button variant="link" onClick={handleMintUsdc}>
                {isMinting ? <LoadingSpinner /> : "Mint 10,000.00 USDC"}
              </Button>
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner /> : "Confirm Investment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
