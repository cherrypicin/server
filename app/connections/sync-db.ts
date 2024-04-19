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

const syncDBSchema = new Schema("SyncDB", {
	data: { type: "string" },
	collection: { type: "string" },
	operation: { type: "string" },
	userId: { type: "string" },
	updatedAt: { type: "date", sortable: true },
	syncId: { type: "number" },
});

const collectionsSchema = new Schema("Collections", {
	_id: { type: "string" },
	banner: { type: "string" },
	bannerStyle: { type: "string" },
	color: { type: "string" },
	// config: { type: "string" },
	bookmarks_sort: { type: "string", path: "$.config.bookmarks.sort" },
	bookmarks_view: { type: "string", path: "$.config.bookmarks.view" },
	bookmarks_hiddenFields: {
		type: "string[]",
		path: "$.config.bookmarks.hiddenFields[*]",
	},
	bookmarks_coverImageSize: {
		type: "number",
		path: "$.config.bookmarks.coverImageSize",
	},
	bookmarks_coverImageRight: {
		type: "boolean",
		path: "$.config.bookmarks.coverImageRight",
	},
	collections_sort: { type: "string", path: "$.config.collections.sort" },
	collection_view: { type: "string", path: "$.config.collections.view" },
	createdAt: { type: "date" },
	description: { type: "string" },
	forkedBy: { type: "string[]" },
	icon: { type: "string" },
	iconSize: { type: "string" },
	image: { type: "string" },
	isDeleted: { type: "boolean" },
	isFavorite: { type: "boolean" },
	isHidden: { type: "boolean" },
	isProtected: { type: "boolean" },
	name: { type: "string" },
	parent: { type: "string" },
	password: { type: "string" },
	pinned: { type: "string[]" },
	previousParent: { type: "string" },
	// sharedWith: { type: "string[]" },
	updatedAt: { type: "date" },
	sharedWith_userId: { type: "string[]", path: "$.sharedWith[*].userId" },
	sharedWith_access: { type: "string[]", path: "$.sharedWith[*].access" },
	sharedWith_root: { type: "boolean", path: "$.sharedWith[*].root" },
	userId: { type: "string" },
});

const tagsSchema = new Schema("Tags", {
	_id: { type: "string" },
	createdAt: { type: "date" },
	name: { type: "string" },
	userId: { type: "string" },
	color: { type: "string" },
	description: { type: "string" },
	icon: { type: "string" },
	isFavorite: { type: "boolean" },
	parent: { type: "string" },
	sharedWith: { type: "string[]" },
	updatedAt: { type: "date" },
});

const syncDBRepository = new Repository(syncDBSchema, redis);
const collectionsRepository = new Repository(collectionsSchema, redis);
const tagsRepository = new Repository(tagsSchema, redis);

try {
	await syncDBRepository.createIndex();
	await collectionsRepository.createIndex();
	await tagsRepository.createIndex();
} catch (e) {
	console.error(e);
}

const getRepository = (collection: string) => {
	stepLogger({ step: "getRepository", params: { collection } });
	switch (collection) {
		case "syncDB":
			return syncDBRepository;
		case "collections":
			return collectionsRepository;
		case "tags":
			return tagsRepository;
		default:
			throw new Error("Repository not found");
	}
};

export {
	redis,
	syncDBRepository,
	collectionsRepository,
	tagsRepository,
	getRepository,
};
