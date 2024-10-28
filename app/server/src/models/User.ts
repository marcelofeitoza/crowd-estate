import { Investment } from "./Investment";

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

export interface UserWithInvestments {
	name: string;
	wallet: string;
	investments: Investment[];
}
