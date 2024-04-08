import { Static, Type } from "typebox";

export const SettingsSchema = Type.Object({
	_id: Type.Optional(Type.String()),
	createdAt: Type.Optional(Type.String({ format: "date-time" })),
	updatedAt: Type.Optional(Type.String({ format: "date-time" })),
	userId: Type.Optional(Type.String()),
	theme: Type.Optional(Type.String()),
	language: Type.Optional(Type.String()),
});

export type Settings = Static<typeof SettingsSchema>;
