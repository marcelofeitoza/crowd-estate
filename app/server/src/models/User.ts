export enum Role {
	Investor = "investor",
	Landlord = "landlord",
}

export interface User {
	id: string;
	publicKey: string;
	name: string;
	role: Role;
}
