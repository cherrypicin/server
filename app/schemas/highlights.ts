import { Static, Type } from "typebox";

const Annotation = Type.Object({
	//NOTE: this mandatory field as it is needed for the query
	_id: Type.String(),
	text: Type.Optional(Type.String()),
	creator: Type.Optional(Type.String()),
});

export const HighlightSchema = Type.Object({
	_id: Type.Optional(Type.String()),
	annotation: Type.Optional(Type.Array(Annotation)),
	bookmarkId: Type.Optional(Type.String()),
	color: Type.Optional(Type.String()),
	createdAt: Type.Optional(Type.String({ format: "date-time" })),
	creator: Type.Optional(Type.String()),
	endNode: Type.Optional(Type.String()),
	endOffset: Type.Optional(Type.Number()),
	isFlagged: Type.Optional(Type.Boolean()),
	isStickyNote: Type.Optional(Type.Boolean()),
	lastUpdatedBy: Type.Optional(Type.String()),
	nodeId: Type.Optional(Type.String()),
	startNode: Type.Optional(Type.String()),
	startOffset: Type.Optional(Type.Number()),
	tags: Type.Optional(Type.Array(Type.String())),
	text: Type.Optional(Type.String()),
	updatedAt: Type.Optional(Type.String({ format: "date-time" })),
	xpathContainer: Type.Optional(Type.String()),
});

export const UpdateHighlightSchema = Type.Partial(HighlightSchema);

export type Highlight = Static<typeof HighlightSchema>;
