import { TagSchema, UpdateTagSchema } from "@schemas";
import * as tagHooks from "./tags-hooks.ts";

export const tagsModel = {
	schema: TagSchema,
	collection: "tags",
	alias: "tags",
	create: {
		schema: TagSchema,
		hooks: {
			pre: tagHooks.preTagCreate,
			post: tagHooks.postTagCreate,
		},
	},
	update: {
		schema: UpdateTagSchema,
		hooks: {
			pre: tagHooks.preTagUpdate,
			post: tagHooks.postTagUpdate,
		},
	},
	delete: {
		hooks: {
			pre: tagHooks.preTagDelete,
			post: tagHooks.postTagDelete,
		},
	},
};
