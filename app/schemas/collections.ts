import { Static, Type } from "typebox";

const BookmarkId = Type.String();

const UserId = Type.String();

const SharedWithSchema = Type.Object({
	//NOTE: this mandatory field as it is needed for the query
	userId: UserId,
	access: Type.Optional(
		Type.Union([Type.Literal("edit"), Type.Literal("view")])
	),
	root: Type.Optional(Type.Boolean()),
});

const ConfigSchema = Type.Object({
	bookmarks: Type.Optional(
		Type.Object({
			view: Type.Optional(Type.String()),
			sort: Type.Optional(Type.String()),
			hiddenFields: Type.Optional(Type.Array(Type.String())),
			coverImageSize: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
			coverImageRight: Type.Optional(Type.Boolean()),
		})
	),
	collections: Type.Optional(
		Type.Object({
			view: Type.Optional(Type.String()),
			sort: Type.Optional(Type.String()),
		})
	),
});

export const CollectionSchema = Type.Object({
	_id: Type.String(),
	banner: Type.Optional(Type.String()),
	bannerStyle: Type.Optional(Type.String()),
	color: Type.Optional(Type.String({ maxLength: 10 })),
	config: Type.Optional(ConfigSchema),
	createdAt: Type.String({ format: "date-time" }),
	description: Type.Optional(Type.String({ maxLength: 150 })),
	forkedBy: Type.Optional(Type.Array(UserId)),
	icon: Type.Optional(Type.String()),
	iconSize: Type.Optional(Type.String()),
	image: Type.Optional(Type.String()),
	isDeleted: Type.Optional(Type.Boolean()),
	isFavorite: Type.Optional(Type.Boolean()),
	isHidden: Type.Optional(Type.Boolean()),
	isProtected: Type.Optional(Type.Boolean()),
	name: Type.String({ maxLength: 50 }),
	parent: Type.String(),
	password: Type.Optional(Type.String()),
	pinned: Type.Optional(Type.Array(BookmarkId)),
	previousParent: Type.Optional(Type.String()),
	sharedWith: Type.Optional(Type.Array(SharedWithSchema)),
	updatedAt: Type.Optional(Type.String({ format: "date-time" })),
	userId: UserId,
});

export const UpdateCollectionSchema = Type.Partial(CollectionSchema);

export type Collection = Static<typeof CollectionSchema>;
