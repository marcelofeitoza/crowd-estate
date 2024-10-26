import { program } from "../../services/crowd-estate";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const listInvestmentsSchema = z.object({
	publicKey: z.string().min(32),
});

export const handleListInvestments = async (body: any) => {
	const parseResult = listInvestmentsSchema.safeParse(body);
	if (!parseResult.success) {
		throw { code: 400, message: "Invalid input parameters" };
	}
	const { publicKey } = parseResult.data;

	try {
		const investorPublicKey = new PublicKey(publicKey);

		const fetchedInvestments = await program.account.investor.all();

		const investmentsData = fetchedInvestments
			.filter((investment) =>
				investment.account.investor.equals(investorPublicKey)
			)
			.map((investment) => ({
				publicKey: investment.publicKey.toBase58(),
				investor: investment.account.investor.toBase58(),
				property: investment.account.property.toBase58(),
				amount: investment.account.tokensOwned.toNumber(),
				dividendsClaimed:
					investment.account.dividendsClaimed.toNumber(),
			}));

		const fetchedProperties = await program.account.property.all();

		const properties = fetchedProperties.map((property) => ({
			publicKey: property.publicKey.toBase58(),
			price_per_token: property.account.tokenPriceUsdc.toNumber() / 1e6,
		}));

		let invested = 0;
		let returns = 0;

		investmentsData.forEach((investment) => {
			const property = properties.find(
				(p) => p.publicKey === investment.property
			);
			if (property) {
				invested += investment.amount * property.price_per_token;
				returns += investment.dividendsClaimed / 1e6;
			}
		});

		return { investmentsData, invested, returns };
	} catch (error) {
		console.error("Error fetching investments:", error);
		throw { code: 500, message: "Failed to fetch investments" };
	}
};
