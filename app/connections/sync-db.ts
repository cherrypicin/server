import { Schema, Repository } from "redis-om";

import { connectToRedis } from "./cache.ts";

const redis = await connectToRedis();

const syncDBSchema = new Schema("SyncDB", {
	data: { type: "string" },
	collection: { type: "string" },
	operation: { type: "string" },
	userId: { type: "string" },
	updatedAt: { type: "date", sortable: true },
	syncId: { type: "number" },
});

const syncDBRepository = new Repository(syncDBSchema, redis);

await syncDBRepository.createIndex();

export { syncDBRepository };
