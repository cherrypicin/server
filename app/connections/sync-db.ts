import { Schema, Repository } from "redis-om";

import { connectToRedis } from "./cache.ts";
import { stepLogger } from "@utils";
import { load } from "dotenv";
import { createClient } from "npm:redis@4.6.13";

const env = await load();

const REDIS_PASSWORD = env["REDIS_PASSWORD"] as string;
const REDIS_HOST = env["REDIS_HOST"] as string;
const REDIS_PORT = parseInt(env["REDIS_PORT"] as string, 10);

let redis: any;

redis = createClient({
	password: REDIS_PASSWORD,
	socket: {
		host: REDIS_HOST,
		port: REDIS_PORT,
		connectTimeout: 40000,
	},
});

await redis.connect();

console.log("Connected to Redis from sync db!");

const syncDBSchema = new Schema("Sync", {
	data: { type: "string" },
	collection: { type: "string" },
	operation: { type: "string" },
	userId: { type: "string" },
	updatedAt: { type: "date", sortable: true },
	syncId: { type: "number" },
});

const sessionSchema = new Schema("Session", {
	userId: { type: "string" },
	token: { type: "string" },
	email: { type: "string" },
	deviceDetails: { type: "string" },
	_id: { type: "string" },
	timeZone: { type: "string" },
});

const syncDBRepository = new Repository(syncDBSchema, redis);
const sessionRepository = new Repository(sessionSchema, redis);

try {
	await syncDBRepository.createIndex();
	await sessionRepository.createIndex();
} catch (e) {
	console.error(e);
}

const getRepository = (collection: string) => {
	stepLogger({ step: "getRepository", params: { collection } });
	switch (collection) {
		case "sync":
			return syncDBRepository;
		case "session":
			return sessionRepository;
		default:
			throw new Error("Repository not found");
	}
};

export { redis, syncDBRepository, getRepository };
