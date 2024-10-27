export interface Property {
	publicKey: string;
	property_name: string;
	total_tokens: number;
	available_tokens: number;
	token_price_usdc: number;
	token_symbol: string;
	admin: string;
	mint: string;
	bump: number;
	dividends_total: number;
	is_closed: boolean;
}

export interface PropertyDatabase {
	id: string;
	property_pda: string;
	creator_public_key: string;
	created_at: string;
}
