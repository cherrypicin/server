import { createClient } from "npm:redis@4.6.13";
import { load } from "dotenv";

import { withTryCatch } from "../utils/server/with-try-catch.ts";
import { Repository } from "redis-om";

const env = await load();

let redisClient: any;
export const connectToRedis = withTryCatch(async () => {
	if (redisClient) {
		return redisClient;
	}

	console.log("Connecting to Redis...");

	const REDIS_PASSWORD = env["REDIS_PASSWORD"] as string;
	const REDIS_HOST = env["REDIS_HOST"] as string;
	const REDIS_PORT = parseInt(env["REDIS_PORT"] as string, 10);

	try {
		const client = createClient({
			password: REDIS_PASSWORD,
			socket: {
				host: REDIS_HOST,
				port: REDIS_PORT,
				connectTimeout: 40000,
			},
		});

		redisClient = client;
		try {
			await client.connect();
			console.log("Connected to Redis!");

			return client;
		} catch (error) {
			console.error("Failed to connect to Redis", error);
		}
	} catch (error) {
		console.error("Failed to connect to Redis", error);
	}
}, "connection error - Failed to connect to Redis");
