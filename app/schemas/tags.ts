import { Static, Type } from "typebox";
import { Schema, Repository } from "redis-om";

import { connectToRedis } from "@connections";

const redis = await connectToRedis();

export const TagSchema = Type.Object({
	_id: Type.String(),
	createdAt: Type.String({ format: "date-time" }),
	name: Type.String({ maxLength: 26 }),
	userId: Type.String(),
	color: Type.Optional(Type.String()),
	description: Type.Optional(Type.String({ maxLength: 50 })),
	icon: Type.Optional(Type.String()),
	isFavorite: Type.Optional(Type.Boolean()),
	parent: Type.Optional(Type.String()),
	sharedWith: Type.Optional(Type.Array(Type.String())),
	updatedAt: Type.Optional(Type.String({ format: "date-time" })),
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

export const tagsRepository = new Repository(tagsSchema, redis);

export const UpdateTagSchema = Type.Partial(TagSchema);

export type Tag = Static<typeof TagSchema>;
