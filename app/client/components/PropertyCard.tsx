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
import { AlertCircle, Coins, DollarSign, PieChart } from "lucide-react";
import { InvestModal } from "./InvestmentModal";

interface PropertyCardProps {
  property: Property;
  onInvestmentSuccess: () => void;
}

export const PropertyCard = ({
  property,
  onInvestmentSuccess,
}: PropertyCardProps) => (
  <Card className={property.is_closed ? "opacity-70 cursor-not-allowed" : ""}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-xl mb-1">
            {property.property_name}
          </CardTitle>
          <CardDescription>{property.token_symbol}</CardDescription>
        </div>
        <Badge variant={property.is_closed ? "destructive" : "secondary"}>
          {property.is_closed ? "Closed" : "Open"}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
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
              <p className="text-lg">${property.token_price_usdc.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Coins className="w-4 h-4 mr-2 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Tokens</p>
              <p className="text-lg">{property.total_tokens} {property.token_symbol}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <PieChart className="w-4 h-4 mr-2 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Total Dividends</p>
            <p className="text-lg">${property.dividends_total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter>
      {property.is_closed ? (
        <div className="bg-destructive/20 text-destructive p-3 rounded-md flex items-center w-full">
          <AlertCircle className="w-4 h-4 mr-2" />
          <p className="text-sm">
            This property is no longer available for investment.
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
