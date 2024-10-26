export interface Investment {
	publicKey: string;
	investor: string;
	property: string;
	amount: number;
	dividendsClaimed: number;
}

export interface InvestmentDatabase {
	id: string;
	investor_public_key: string;
	property_pda: string;
	created_at: string;
}
