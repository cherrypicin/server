import { tagsModel } from "./tags/tags-model.ts";
import { collectionsModel } from "./collections/collections-model.ts";
import { bookmarksModel } from "./bookmarks/bookmarks-model.ts";
import { highlightsModel } from "./highlights/highlights-model.ts";

export const modelMapping = {
	tags: tagsModel,
	collections: collectionsModel,
	bookmarks: bookmarksModel,
	highlights: highlightsModel,
};
