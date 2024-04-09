import { Schema, Repository } from "npm:redis-om@0.4.3";

import { connectToRedis } from "./cache.ts";

const redis = await connectToRedis();

await redis.connect();

const syncDBSchema = new Schema("SyncDB", {
	data: { type: "string" },
	collection: { type: "string" },
	operation: { type: "string" },
	userId: { type: "string" },
	updatedAt: { type: "date" },
	syncId: { type: "number" },
});

const syncDBRepository = new Repository(syncDBSchema, redis);

await syncDBRepository.createIndex();

export { syncDBRepository };
