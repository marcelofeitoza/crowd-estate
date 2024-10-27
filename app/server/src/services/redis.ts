import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

const CACHE_TTL = 300; // 5 minutes
export enum RedisKeys {
	PropertiesAll = "properties:all",
	Properties = "properties",
}

export const RedisKeyTemplates = {
	property: (propertyPda: string) => `property:${propertyPda}`,
	investment: (investmentPda: string) => `investment:${investmentPda}`,
	investmentsByInvestor: (investorPublicKey: string) =>
		`investments:${investorPublicKey}`,
	investmentsDataByInvestor: (investorPublicKey: string) =>
		`investmentsData:${investorPublicKey}`,
};

class RedisClient {
	private client: RedisClientType;

	constructor() {
		this.client = createClient({
			url: process.env.REDIS_URL || "redis://localhost:6379",
		});

		this.client.on("error", (err) => {
			console.error("Redis Client Error", err);
		});

		this.client
			.connect()
			.then(() => {
				console.log("Connected to Redis");
			})
			.catch((err) => {
				console.error("Error connecting to Redis:", err);
			});
	}

	async invalidate(keys: string[]) {
		for (const key of keys) {
			await this.client.del(key);
			console.log(`[Cache] Invalidated key: ${key}`);
		}
	}

	async set(key: string, value: string) {
		const stringValue = JSON.stringify(value);
		await this.client.setEx(key, CACHE_TTL, stringValue);
		console.log(`[Cache] Set key: ${key}`);
	}

	async del(key: string) {
		await this.client.del(key);
	}

	async get(key: string) {
		const cachedValue = await this.client.get(key);
		if (cachedValue) {
			console.log(`[Cache] Hit for key: ${key}`);
			return JSON.parse(cachedValue);
		} else {
			console.log(`[Cache] Miss for key: ${key}`);
			return null;
		}
	}
}
const redis = new RedisClient();

export { redis };
