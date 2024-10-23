import { ellipsify, Investment } from "@/utils/solana";
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

export const InvestmentCard = ({
	investment,
	onManagementSuccess,
}: {
	investment: Investment;
	onManagementSuccess: () => void;
}) => (
	<Card>
		<CardHeader>
			<CardTitle className="text-xl mb-1">
				Investment in{" "}
				<p className="font-bold hover:scale-105 transition-transform inline cursor-pointer">
					{ellipsify(investment.property)}
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
			{investment.amount > 0 && <ManageInvestmentModal investment={investment} onManagementSuccess={onManagementSuccess} />}

		</CardFooter>
	</Card>
);
