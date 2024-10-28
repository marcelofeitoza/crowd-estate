"use client";

import { useState, useEffect } from "react";
import { Property } from "@/utils/solana";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Coins, DollarSign, PieChart } from "lucide-react";
import { InvestModal } from "./InvestmentModal";

interface PropertyCardProps {
  property: Property;
  onInvestmentSuccess: (refetch?: boolean) => void;
}

export const PropertyCard = ({
  property,
  onInvestmentSuccess,
}: PropertyCardProps) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const PropertyDetail = ({ icon, label, value }) => (
    <div className="flex items-center space-x-2">
      {icon}
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );

  return (
    <Card className={property.is_closed ? "opacity-70 cursor-not-allowed" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">
              {loading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                property.property_name
              )}
            </CardTitle>
            <CardDescription>
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                property.token_symbol
              )}
            </CardDescription>
          </div>
          {loading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <Badge variant={property.is_closed ? "destructive" : "secondary"}>
              {property.is_closed ? "Closed" : "Open"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Available Tokens</span>
            </div>
            {loading ? (
              <Skeleton className="h-2 w-full" />
            ) : (
              <Progress
                value={
                  (property.available_tokens / property.total_tokens) * 100
                }
              />
            )}
            <div className="flex justify-between text-sm mt-1">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </>
              ) : (
                <>
                  <span>{property.available_tokens.toLocaleString()}</span>
                  <span>out of {property.total_tokens.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              <>
                <PropertyDetail
                  icon={<DollarSign className="w-4 h-4 text-primary" />}
                  label="Token Price"
                  value={`$${property.token_price_usdc.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}`}
                />
                <PropertyDetail
                  icon={<Coins className="w-4 h-4 text-primary" />}
                  label="Total Tokens"
                  value={`${property.total_tokens.toLocaleString()} ${property.token_symbol}`}
                />
              </>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <PropertyDetail
              icon={<PieChart className="w-4 h-4 text-primary" />}
              label="Total Dividends"
              value={`$${property.dividends_total.toFixed(2)}`}
            />
          )}
        </div>
      </CardContent>
      <CardFooter>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : property.is_closed ? (
          <div className="bg-destructive/20 text-destructive p-3 rounded-md flex items-center w-full">
            <AlertCircle className="w-4 h-4 mr-2" />
            <p className="text-sm">
              This property is no longer available for investment.
            </p>
          </div>
        ) : property.available_tokens === 0 ? (
          <div className="bg-warning/20 text-warning p-3 rounded-md flex items-center w-full">
            <AlertCircle className="w-3 h-3 mr-2 text-zinc-600" />
            <p className="text-zinc-600 text-sm">
              This property is fully invested.
            </p>
          </div>
        ) : (
          <InvestModal
            property={property}
            onInvestmentSuccess={onInvestmentSuccess}
          />
        )}
      </CardFooter>
    </Card>
  );
};
