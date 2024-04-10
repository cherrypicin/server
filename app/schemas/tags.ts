import { Static, Type } from "typebox";

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

export const UpdateTagSchema = Type.Partial(TagSchema);

export type Tag = Static<typeof TagSchema>;
