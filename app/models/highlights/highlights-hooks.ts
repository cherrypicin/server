import { HandleOperationParams } from "../../factory/types.ts";
import { stepLogger } from "../../utils/server/index.ts";
import { HooksParams } from "../types.ts";

export const preHighlightGetFilter = async (params: HooksParams) => {
	const { userId } = params;

	// const filter = {
	// 	$or: [{ userId }, { "sharedWith.userId": userId }],
	// };
	const filter = { userId };

	return { filter };
};

export const preHighlightCreate = async (params: HooksParams) => {
	stepLogger({ step: "preHighlightCreate", params });
};

export const preHighlightUpdate = async (params: HooksParams) => {
	stepLogger({ step: "preHighlightUpdate", params });
};

export const preHighlightDelete = async (params: HooksParams) => {
	stepLogger({ step: "preHighlightDelete", params });
};

export const postHighlightCreate = async (params: HooksParams) => {
	stepLogger({ step: "postHighlightCreate", params });
};

export const postHighlightUpdate = async (params: HooksParams) => {
	stepLogger({ step: "postHighlightUpdate", params });
};

export const postHighlightDelete = async (params: HooksParams) => {
	stepLogger({ step: "postHighlightDelete", params });
};
