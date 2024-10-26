export interface Property {
	name: string;
	total_tokens: number;
	available_tokens: number;
	price_per_token: number;
	token_symbol: string;
	property_pda: string;
	creator_public_key: string;
	is_closed: boolean;
}

export interface PropertyDatabase {
	id: string;
	property_pda: string;
	creator_public_key: string;
	created_at: string;
}
