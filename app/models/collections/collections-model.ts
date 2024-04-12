import { CollectionSchema, UpdateCollectionSchema } from "@schemas";
import * as collectionHooks from "./collections-hooks.ts";

export const collectionsModel = {
	schema: CollectionSchema,
	collection: "collections",
	alias: "collections",
	get: {
		hooks: {
			pre: collectionHooks.preCollectionGetFilter,
		},
	},
	create: {
		schema: CollectionSchema,
		hooks: {
			pre: collectionHooks.preCollectionCreate,
			post: collectionHooks.postCollectionCreate,
		},
	},
	update: {
		schema: UpdateCollectionSchema,
		hooks: {
			pre: collectionHooks.preCollectionUpdate,
			post: collectionHooks.postCollectionUpdate,
		},
	},
	delete: {
		hooks: {
			pre: collectionHooks.preCollectionDelete,
			post: collectionHooks.postCollectionDelete,
		},
	},
};
