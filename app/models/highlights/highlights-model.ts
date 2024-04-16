import { HighlightSchema } from "@schemas";
import * as highlightHooks from "./highlights-hooks.ts";

export const highlightsModel = {
	schema: HighlightSchema,
	collection: "highlights",
	alias: "highlights",
	create: {
		schema: HighlightSchema,
		hooks: {
			pre: highlightHooks.preHighlightCreate,
			post: highlightHooks.postHighlightCreate,
		},
	},
	update: {
		schema: HighlightSchema,
		hooks: {
			pre: highlightHooks.preHighlightUpdate,
			post: highlightHooks.postHighlightUpdate,
		},
	},
	delete: {
		hooks: {
			pre: highlightHooks.preHighlightDelete,
			post: highlightHooks.postHighlightDelete,
		},
	},
};
