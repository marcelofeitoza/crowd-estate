"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Investment,
  Property,
  USDC_MINT,
  ensureAssociatedTokenAccount,
} from "@/utils/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  SendTransactionError,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  ChartBarIcon,
  ChartColumnIcon,
  Coins,
  DollarSign,
  PieChart,
} from "lucide-react";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAnchor } from "@/hooks/use-anchor";

interface ManageInvestmentProps {
  investment: Investment;
  propertyData: Property;
  onManagementSuccess: () => void;
}

export const ManageInvestmentModal = ({
  investment,
  propertyData,
  onManagementSuccess,
}: ManageInvestmentProps) => {
  const { program, provider } = useAnchor();
  const wallet = useWallet();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [walletUsdcBalance, setWalletUsdcBalance] = useState<number>(0);
  const [, setErrorUsdcBalance] = useState<boolean>(false);

  useEffect(() => {
    const getUsdcBalance = async () => {
      try {
        const userUsdcAddress = await getAssociatedTokenAddress(
          USDC_MINT,
          wallet.publicKey,
        );

        const balance = await provider.connection
          .getTokenAccountBalance(userUsdcAddress)
          .then((balance) => balance.value.uiAmount)
          .catch((error) => {
            setWalletUsdcBalance(0);
            setErrorUsdcBalance(true);
            throw error;
          });

        setWalletUsdcBalance(balance);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setWalletUsdcBalance(0);
      }
    };

    if (wallet.publicKey) {
      getUsdcBalance();
    }
  }, [provider.connection, wallet.publicKey]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey || !program || !provider) {
      toast({
        title: "Error",
        description: "Connect your Solana wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

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
        description: "Withdrawal successful!",
        variant: "default",
      });

      setIsSubmitting(false);
      setIsOpen(false);
      onManagementSuccess();
    } catch (error) {
      if (error instanceof SendTransactionError) {
        console.error(
          "Transaction error:",
          await error.getLogs(provider.connection),
        );
      } else {
        console.error("Withdrawal error:", error);
      }
      toast({
        title: "Error",
        description: "Failed to withdraw. Check the console.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const collectDividends = async () => {
    // Implement collectDividends logic here
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
        <DialogTrigger asChild>
          <Button
            variant="default"
            disabled={investment.amount === 0}
            className="w-full sm:w-auto"
          >
            Manage Investment
          </Button>
        </DialogTrigger>
        <Button
          variant="outline"
          disabled={investment.amount === 0}
          onClick={collectDividends}
          className="w-full sm:w-auto"
        >
          Collect Dividends
        </Button>
      </div>

      <DialogContent className="sm:max-w-[425px]">
        {investment && propertyData ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">
                Withdraw Investment in {propertyData.property_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Invested</span>
                  <span>
                    $
                    {(
                      investment.amount * propertyData.token_price_usdc
                    ).toFixed(2)}{" "}
                    USDC / {investment.amount} {propertyData.token_symbol}
                  </span>
                </div>
                <Progress
                  value={(investment.amount / propertyData.total_tokens) * 100}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <InvestmentDetail
                  icon={
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                  }
                  label="Invested Value"
                  value={`$${(investment.amount * propertyData.token_price_usdc).toFixed(2)}`}
                />
                <InvestmentDetail
                  icon={<Coins className="w-5 h-5 text-muted-foreground" />}
                  label="Token Symbol"
                  value={propertyData.token_symbol}
                />
                <InvestmentDetail
                  icon={
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                  }
                  label="Price per Token"
                  value={`$${propertyData.token_price_usdc.toFixed(2)}`}
                />
                <InvestmentDetail
                  icon={
                    <ChartBarIcon className="w-5 h-5 text-muted-foreground" />
                  }
                  label="Total Tokens"
                  value={`${propertyData.total_tokens} ${propertyData.token_symbol}`}
                />
                <InvestmentDetail
                  icon={
                    <ChartColumnIcon className="w-5 h-5 text-muted-foreground" />
                  }
                  label="Tokens Owned"
                  value={`${investment.amount} ${propertyData.token_symbol}`}
                />
                <InvestmentDetail
                  icon={<PieChart className="w-5 h-5 text-muted-foreground" />}
                  label="Dividends Claimed"
                  value={`$${(investment.dividendsClaimed / 1e6).toFixed(2)}`}
                />
              </div>
            </div>

            <Separator />

            <form onSubmit={handleWithdraw} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                USDC Balance: {walletUsdcBalance.toFixed(2)}
              </p>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <LoadingSpinner /> : "Confirm Withdrawal"}
              </Button>
            </form>
          </>
        ) : (
          <LoadingSpinner />
        )}
      </DialogContent>
    </Dialog>
  );
};

const InvestmentDetail = ({ icon, label, value }) => (
  <div className="flex items-center space-x-2">
    {icon}
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);
