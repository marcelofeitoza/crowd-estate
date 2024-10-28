/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchor } from "@/hooks/use-anchor";
import { SendTransactionError } from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";
import { Investment, Property } from "@/utils/solana";
import { withdrawInvestment } from "@/services/program";
import { getUsdcBalance } from "@/services/usdc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ChartBarIcon,
  ChartColumnIcon,
  Coins,
  DollarSign,
  PieChart,
  ArrowUpRight,
} from "lucide-react";

interface ManageInvestmentProps {
  investment: Investment;
  propertyData: Property;
  onManagementSuccess: (refetch?: boolean) => void;
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
  const userDividends =
    (investment.amount / propertyData.total_tokens) *
    propertyData.dividends_total;

  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (wallet.publicKey) {
        try {
          const balance = await getUsdcBalance(provider, wallet.publicKey);
          setWalletUsdcBalance(balance);
        } catch (error) {
          // console.error("Error fetching USDC balance:", error);
        }
      }
    };

    fetchUsdcBalance();
  }, [provider, wallet.publicKey]);

  const handleWithdraw = async (e: React.FormEvent) => {
    // console.log("withdraw");
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

      const { txSignature } = await withdrawInvestment(
        provider,
        program,
        investment,
        propertyData,
        wallet,
      );

      // console.log(
      // 	`https://solscan.io/tx/${txSignature}?cluster=${provider.connection.rpcEndpoint}`
      // );

      toast({
        title: "Success",
        description: "Withdrawal successful!",
        variant: "default",
      });

      setIsOpen(false);
      onManagementSuccess(true);
    } catch (error) {
      // if (error instanceof SendTransactionError) {
      // console.error(
      // 	"Transaction error:",
      // 	await error.getLogs(provider.connection)
      // );
      // } else {
      // console.error("Withdrawal error:", error);
      // }
      toast({
        title: "Error",
        description: "Failed to withdraw. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const collectDividends = async () => {
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

      const { txSignature } = await withdrawInvestment(
        provider,
        program,
        investment,
        propertyData,
        wallet,
      );

      // console.log(
      // 	`https://solscan.io/tx/${txSignature}?cluster=${provider.connection.rpcEndpoint}`
      // );

      toast({
        title: "Success",
        description: "Dividends collected!",
        variant: "default",
      });

      setIsOpen(false);
      onManagementSuccess(true);
    } catch (error) {
      // if (error instanceof SendTransactionError) {
      // console.error(
      // 		"Transaction error:",
      // 		await error.getLogs(provider.connection)
      // 	);
      // } else {
      // console.error("Dividends collection error:", error);
      // }
      toast({
        title: "Error",
        description: "Failed to collect dividends. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const InvestmentDetail = ({ icon, label, value }) => (
    <Card>
      <CardContent className="flex items-center p-4">
        {icon}
        <div className="ml-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col sm:flex-row justify-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 w-full">
        <DialogTrigger asChild>
          <Button
            variant="default"
            disabled={investment.amount === 0}
            className="w-full sm:w-auto"
          >
            Manage Investment
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[550px]">
        {investment && propertyData ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Manage Investment in {propertyData.property_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 my-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Your Investment</span>
                  <span className="text-muted-foreground">
                    {investment.amount.toLocaleString()} /{" "}
                    {propertyData.total_tokens.toLocaleString()}{" "}
                    {propertyData.token_symbol}
                  </span>
                </div>
                <Progress
                  value={(investment.amount / propertyData.total_tokens) * 100}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InvestmentDetail
                  icon={<DollarSign className="w-5 h-5 text-primary" />}
                  label="Invested Value"
                  value={`$${(
                    investment.amount * propertyData.token_price_usdc
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                />
                <InvestmentDetail
                  icon={<Coins className="w-5 h-5 text-primary" />}
                  label="Token Symbol"
                  value={propertyData.token_symbol}
                />
                <InvestmentDetail
                  icon={<DollarSign className="w-5 h-5 text-primary" />}
                  label="Price per Token"
                  value={`$${propertyData.token_price_usdc.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}`}
                />
                <InvestmentDetail
                  icon={<ChartBarIcon className="w-5 h-5 text-primary" />}
                  label="Total Tokens"
                  value={`${propertyData.total_tokens.toLocaleString()} ${propertyData.token_symbol}`}
                />
                <InvestmentDetail
                  icon={<ChartColumnIcon className="w-5 h-5 text-primary" />}
                  label="Tokens Owned"
                  value={`${investment.amount.toLocaleString()} ${propertyData.token_symbol}`}
                />
                <InvestmentDetail
                  icon={<PieChart className="w-5 h-5 text-primary" />}
                  label="Dividends Distributed"
                  value={`$${propertyData.dividends_total.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}`}
                />
                <InvestmentDetail
                  icon={<PieChart className="w-5 h-5 text-primary" />}
                  label="Dividends Claimed"
                  value={`$${investment.dividendsClaimed.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}`}
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <p className="text-sm text-center">
                USDC Balance:{" "}
                <span className="font-semibold">
                  $
                  {walletUsdcBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>

              {propertyData.dividends_total > 0 ? (
                <>
                  <p className="text-sm text-center">
                    You have{" "}
                    <span className="font-semibold">
                      $
                      {userDividends.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>{" "}
                    in dividends to collect.
                  </p>
                  <Button
                    disabled={investment.amount === 0 || isSubmitting}
                    onClick={collectDividends}
                    className="w-full"
                  >
                    <Coins className="h-4 w-4" />
                    {isSubmitting
                      ? "Processing..."
                      : "Collect Dividends and Withdraw"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleWithdraw}
                  disabled={isSubmitting}
                  className="w-full space-x-2"
                >
                  {isSubmitting ? (
                    <LoadingSpinner />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Processing..." : "Withdraw Investment"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner height={4} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
