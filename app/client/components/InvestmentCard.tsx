import { ellipsify, Investment, Property } from "@/utils/solana";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Coins, Wallet } from "lucide-react";
import { ManageInvestmentModal } from "./ManageInvestmentModal";
import { useEffect, useState } from "react";
import { useAnchor } from "@/hooks/use-anchor";
import { PublicKey } from "@solana/web3.js";
import { LoadingSpinner } from "./LoadingSpinner";

export const InvestmentCard = ({
  investment,
  onManagementSuccess,
}: {
  investment: Investment;
  onManagementSuccess: () => void;
}) => {
  const { program } = useAnchor();
  const [propertyData, setPropertyData] = useState<Property>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyData = async () => {
      const p = await program.account.property.fetch(
        new PublicKey(investment.property),
      );
      setPropertyData({
        mint: p.mint.toBase58(),
        admin: p.admin.toBase58(),
        available_tokens: p.availableTokens.toNumber(),
        bump: p.bump,
        dividends_total: p.dividendsTotal.toNumber(),
        is_closed: p.isClosed,
        property_name: Buffer.from(p.propertyName).toString(),
        publicKey: investment.property,
        token_price_usdc: p.tokenPriceUsdc.toNumber() / 1e6,
        token_symbol: Buffer.from(p.tokenSymbol).toString(),
        total_tokens: p.totalTokens.toNumber(),
      });
      setLoading(false);
    };

    if (investment.property) {
      fetchPropertyData();
    }
  }, [investment, program.account.property]);

  return (
    <Card>
      {!loading ? (
        <>
          <CardHeader>
            <CardTitle className="text-xl mb-1">
              Investment in{" "}
              <p className="font-bold hover:scale-105 transition-transform inline cursor-pointer">
                {propertyData.property_name}
              </p>
            </CardTitle>
            <CardDescription>
              Investment ID: {ellipsify(investment.publicKey)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Wallet className="w-4 h-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Invested Amount</p>
                  <p className="text-lg">{investment.amount} tokens</p>
                </div>
              </div>
              <div className="flex items-center">
                <Coins className="w-4 h-4 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dividends Claimed</p>
                  <p className="text-lg">
                    ${investment.dividendsClaimed.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {investment.amount > 0 && (
              <ManageInvestmentModal
                investment={investment}
                propertyData={propertyData}
                onManagementSuccess={onManagementSuccess}
              />
            )}
          </CardFooter>
        </>
      ) : (
        <LoadingSpinner />
      )}
    </Card>
  );
};
