import { getProperty } from "../../services/crowd-estate";
import { redis, RedisKeyTemplates } from "../../services/redis";

export const handleGetProperty = async (propertyPda) => {
	if (!propertyPda) {
		throw {
			code: 400,
			message: "Missing property PDA",
		};
	}

	try {
		const cacheKey = RedisKeyTemplates.property(propertyPda);
		const cachedProperty = await redis.get(cacheKey);

		if (cachedProperty) {
			return { property: JSON.parse(cachedProperty) };
		}

		const property = await getProperty(propertyPda);

		await redis.set(`property:${propertyPda}`, JSON.stringify(property));

		return { property };
	} catch (error: any) {
		console.error("Error handling get property:", error);
		throw {
			code: error.code || 500,
			message: error.message || "Internal server error",
		};
	}
};
