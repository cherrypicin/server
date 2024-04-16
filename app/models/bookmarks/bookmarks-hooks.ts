import { HandleOperationParams } from "../../factory/types.ts";
import { stepLogger } from "../../utils/server/index.ts";
import { HooksParams } from "../types.ts";

export const preBookmarkGetFilter = async (params: HooksParams) => {
	const { userId } = params;

	// const filter = {
	// 	$or: [{ userId }, { "sharedWith.userId": userId }],
	// };
	const filter = { userId };

	return { filter };
};

export const preBookmarkCreate = async (params: HooksParams) => {
	stepLogger({ step: "preBookmarkCreate", params });
};

export const preBookmarkUpdate = async (params: HooksParams) => {
	stepLogger({ step: "preBookmarkUpdate", params });
};

export const preBookmarkDelete = async (params: HooksParams) => {
	stepLogger({ step: "preBookmarkDelete", params });
};

export const postBookmarkCreate = async (params: HooksParams) => {
	stepLogger({ step: "postBookmarkCreate", params });
};

export const postBookmarkUpdate = async (params: HooksParams) => {
	stepLogger({ step: "postBookmarkUpdate", params });
};

export const postBookmarkDelete = async (params: HooksParams) => {
	stepLogger({ step: "postBookmarkDelete", params });
};
