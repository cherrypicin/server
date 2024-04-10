import { createClient } from "npm:redis@4.6.13";
import { load } from "dotenv";

import { withTryCatch } from "../utils/server/with-try-catch.ts";

const env = await load();

let redisClient: any;
export const connectToRedis = withTryCatch(async () => {
	if (redisClient) {
		console.log("Reusing existing Redis connection...");
		return redisClient;
	}

	console.log("Connecting to Redis...");

	const REDIS_PASSWORD = env["REDIS_PASSWORD"] as string;
	const REDIS_HOST = env["REDIS_HOST"] as string;
	const REDIS_PORT = parseInt(env["REDIS_PORT"] as string, 10);

	const client = createClient({
		password: REDIS_PASSWORD,
		socket: {
			host: REDIS_HOST,
			port: REDIS_PORT,
		},
	});

	redisClient = client;
	await client.connect();
	console.log("Connected to Redis!");
	return client;
}, "connection error - Failed to connect to Redis");
