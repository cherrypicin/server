import { BookmarkSchema, UpdateBookmarkSchema } from "@schemas";
import * as bookmarkHooks from "./bookmarks-hooks.ts";
export const bookmarksModel = {
	schema: BookmarkSchema,
	collection: "bookmarks",
	alias: "bookmarks",
	get: {
		hooks: {
			pre: bookmarkHooks.preBookmarkGetFilter,
		},
	},
	create: {
		schema: BookmarkSchema,
		hooks: {
			pre: bookmarkHooks.preBookmarkCreate,
			post: bookmarkHooks.postBookmarkCreate,
		},
	},
	update: {
		schema: UpdateBookmarkSchema,
		hooks: {
			pre: bookmarkHooks.preBookmarkUpdate,
			post: bookmarkHooks.postBookmarkUpdate,
		},
	},
	delete: {
		hooks: {
			pre: bookmarkHooks.preBookmarkDelete,
			post: bookmarkHooks.postBookmarkDelete,
		},
	},
};
