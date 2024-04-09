import { Static, Type } from "typebox";

const ImageType = Type.Union([
	Type.Literal("screenshot_user"),
	Type.Literal("upload_cdn_url"),
	Type.Literal("upload_media_img"),
	Type.Literal("screenshot_system"),
	Type.Literal("ifttt_screenshot"),
]);

const Image = Type.Object({
	type: ImageType,
	url: Type.String(),
});

const HighlightId = Type.String();

const Reminder = Type.Object({
	_id: Type.String(),
	time: Type.String({ format: "date-time" }),
	type: Type.String(),
	text: Type.String(),
});

export const BookmarkSchema = Type.Object({
	_id: Type.String(),
	accessCount: Type.Optional(Type.Number()),
	author: Type.Optional(Type.String()),
	color: Type.Optional(Type.String()),
	coverImage: Type.Optional(Type.String({ format: "uri" })),
	createdAt: Type.String({ format: "date-time" }),
	creator: Type.Optional(Type.String()),
	description: Type.Optional(Type.String({ maxLength: 500 })),
	domain: Type.Optional(Type.String()),
	faviconUrl: Type.Optional(Type.String()),
	groups: Type.Optional(Type.Array(Type.String())),
	hasGroups: Type.Optional(Type.Boolean()),
	hasHighlights: Type.Optional(Type.Boolean()),
	hasPermanentCopy: Type.Optional(Type.Boolean()),
	hasReminder: Type.Optional(Type.Boolean()),
	hasTags: Type.Optional(Type.Boolean()),
	highlights: Type.Optional(Type.Array(HighlightId)),
	images: Type.Optional(Type.Array(Image)),
	isBroken: Type.Optional(Type.Boolean()),
	isDeleted: Type.Optional(Type.Boolean()),
	isDuplicateAndShared: Type.Optional(Type.Boolean()),
	isFavorite: Type.Optional(Type.Boolean()),
	isFile: Type.Optional(Type.Boolean()),
	isNote: Type.Optional(Type.Boolean()),
	isRead: Type.Optional(Type.Boolean()),
	isSnippet: Type.Optional(Type.Boolean()),
	isWindow: Type.Optional(Type.Boolean()),
	lastAccess: Type.Optional(Type.String({ format: "date-time" })),
	lastUpdateBy: Type.Optional(Type.String()),
	length: Type.Optional(Type.Number()),
	linkedItems: Type.Optional(Type.Array(Type.String())),
	note: Type.Optional(Type.String()),
	noteColor: Type.Optional(Type.String()),
	noteFontColor: Type.Optional(Type.String()),
	parent: Type.Optional(Type.String()),
	pinnedCollections: Type.Optional(Type.Array(Type.String())),
	previousParent: Type.Optional(Type.String()),
	rating: Type.Optional(Type.Number()),
	readingTime: Type.Optional(Type.String()),
	reminder: Type.Optional(Reminder),
	snippet: Type.Optional(Type.String()),
	source: Type.Optional(Type.String()),
	tags: Type.Optional(Type.Array(Type.String())),
	title: Type.Optional(Type.String({ maxLength: 200 })),
	type: Type.Optional(Type.String()),
	updatedAt: Type.String({ format: "date-time" }),
	url: Type.Optional(Type.String({ format: "uri" })),
	userId: Type.String(),
	words: Type.Optional(Type.Number()),
});
