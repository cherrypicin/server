import { Static, Type } from "typebox";
import { Schema, Repository } from "redis-om";

import { connectToRedis } from "@connections";

const redis = await connectToRedis();

// await redis.connect();

const BookmarkId = Type.String();

const UserId = Type.String();

const SharedWithSchema = Type.Object({
	userId: UserId,
	access: Type.Union([Type.Literal("edit"), Type.Literal("view")]),
	root: Type.Boolean(),
});

const ConfigSchema = Type.Object({
	bookmarks: Type.Object({
		view: Type.String(),
		sort: Type.String(),
		hiddenFields: Type.Array(Type.String()),
		coverImageSize: Type.Number({ minimum: 0, maximum: 1 }),
		coverImageRight: Type.Boolean(),
	}),
	collections: Type.Object({
		view: Type.String(),
		sort: Type.String(),
	}),
});

export const CollectionSchema = Type.Object({
	_id: Type.Optional(Type.String()),
	banner: Type.Optional(Type.String()),
	bannerStyle: Type.Optional(Type.String()),
	color: Type.Optional(Type.String({ maxLength: 10 })),
	config: Type.Optional(ConfigSchema),
	createdAt: Type.Optional(Type.String({ format: "date-time" })),
	description: Type.Optional(Type.String({ maxLength: 150 })),
	forkedBy: Type.Optional(Type.Array(UserId)),
	icon: Type.Optional(Type.String()),
	iconSize: Type.Optional(Type.String()),
	image: Type.Optional(Type.String()),
	isDeleted: Type.Optional(Type.Boolean()),
	isFavorite: Type.Optional(Type.Boolean()),
	isHidden: Type.Optional(Type.Boolean()),
	isProtected: Type.Optional(Type.Boolean()),
	name: Type.Optional(Type.String({ maxLength: 50 })),
	parent: Type.Optional(Type.String()),
	password: Type.Optional(Type.String()),
	pinned: Type.Optional(Type.Array(BookmarkId)),
	previousParent: Type.Optional(Type.String()),
	sharedWith: Type.Optional(Type.Array(SharedWithSchema)),
	updatedAt: Type.Optional(Type.String({ format: "date-time" })),
	userId: Type.Optional(UserId),
});

const collectionsSchema = new Schema("Collections", {
	_id: { type: "string" },
	banner: { type: "string" },
	bannerStyle: { type: "string" },
	color: { type: "string" },
	config: { type: "string" },
	bookmarks_sort: { type: "string", path: "$.config.bookmarks.sort" },
	bookmarks_view: { type: "string", path: "$.config.bookmarks.view" },
	bookmarks_hiddenFields: {
		type: "string[]",
		path: "$.config.bookmarks.hiddenFields",
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
	sharedWith: { type: "string[]" },
	updatedAt: { type: "date" },
	sharedWith_userId: { type: "string", path: "$.sharedWith[*].userId" },
	sharedWith_access: { type: "string", path: "$.sharedWith[*].access" },
	sharedWith_root: { type: "boolean", path: "$.sharedWith[*].root" },
	userId: { type: "string" },
});

export const collectionsRepository = new Repository(collectionsSchema, redis);

export const UpdateCollectionSchema = Type.Partial(CollectionSchema);

export type Collection = Static<typeof CollectionSchema>;
