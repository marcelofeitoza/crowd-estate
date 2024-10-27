import { getInvestment, getProperty } from "../../services/crowd-estate";
import { redis, RedisKeyTemplates } from "../../services/redis";

export const handleGetInvestment = async (investmentPda: string) => {
	if (!investmentPda) {
		throw {
			code: 400,
			message: "Missing investment ID",
		};
	}

	try {
		const cacheKey = RedisKeyTemplates.investment(investmentPda);
		const cachedInvestment = await redis.get(cacheKey);
		if (cachedInvestment) {
			return { investment: JSON.parse(cachedInvestment) };
		}

		const investment = await getInvestment(investmentPda);

		await redis.set(
			`investment:${investmentPda}`,
			JSON.stringify(investment)
		);

		return { investment };
	} catch (error: any) {
		console.error("Error handling get investment:", error);
		throw {
			code: error.code || 500,
			message: error.message || "Internal server error",
		};
	}
};
