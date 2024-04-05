import { createClient } from "npm:redis@4.6.13";
import { load } from "dotenv";
import { withTryCatch } from "../utils/server/with-try-catch.ts";

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

	const client = createClient({
		password: REDIS_PASSWORD,
		socket: {
			host: REDIS_HOST,
			port: REDIS_PORT,
		},
	});

	console.log("Connected to Redis");

	redisClient = client;
	return client;
}, "connection error - Failed to connect to Redis");
