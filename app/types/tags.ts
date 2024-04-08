import { Static, Type } from "typebox";

export const TagSchema = Type.Object({
	_id: Type.Optional(Type.String()),
	color: Type.Optional(Type.String({ maxLength: 10 })),
	createdAt: Type.Optional(Type.String({ format: "date-time" })),
	description: Type.Optional(Type.String({ maxLength: 50 })),
	icon: Type.Optional(Type.String()),
	isFavorite: Type.Optional(Type.Boolean()),
	name: Type.Optional(Type.String({ maxLength: 26 })),
	parent: Type.Optional(Type.String()),
	sharedWith: Type.Optional(Type.Array(Type.String())),
	updatedAt: Type.Optional(Type.String({ format: "date-time" })),
	userId: Type.Optional(Type.String()),
});

export type Tag = Static<typeof TagSchema>;

console.log(JSON.stringify(TagSchema, null, 2));
