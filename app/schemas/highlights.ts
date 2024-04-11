import { Static, Type } from "typebox";

const Annotation = Type.Object({
	//NOTE: this mandatory field as it is needed for the query
	_id: Type.String(),
	text: Type.Optional(Type.String()),
	creator: Type.Optional(Type.String()),
});

export const HighlightSchema = Type.Object({
	_id: Type.String(),
	annotation: Type.Array(Annotation),
	bookmarkId: Type.String(),
	color: Type.String(),
	createdAt: Type.String({ format: "date-time" }),
	creator: Type.String(),
	endNode: Type.String(),
	endOffset: Type.Number(),
	isFlagged: Type.Boolean(),
	isStickyNote: Type.Boolean(),
	lastUpdatedBy: Type.String(),
	nodeId: Type.String(),
	startNode: Type.String(),
	startOffset: Type.Number(),
	tags: Type.Array(Type.String()),
	text: Type.String(),
	updatedAt: Type.String({ format: "date-time" }),
	xpathContainer: Type.String(),
});
