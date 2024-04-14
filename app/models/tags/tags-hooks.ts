import { stepLogger } from "@utils";

import { HooksParams } from "../types.ts";

export const preTagCreate = async ({ data }: HooksParams) => {
	stepLogger({ step: "preTagCreate", params: { data } });
};
export const preTagUpdate = async ({ data }: HooksParams) => {};
export const preTagDelete = async ({ data }: HooksParams) => {};

export const preTagGet = async (params: HooksParams) => {
	stepLogger({ step: "postTagGet", params });

	const { userId } = params;
	const filter = { userId };
	return { filter };
};

export const postTagCreate = async ({ data }: HooksParams) => {
	stepLogger({ step: "postTagCreate", params: { data } });
};

export const postTagUpdate = async ({ data, _ids }: HooksParams) => {
	stepLogger({ step: "postTagUpdate", params: { data, _ids } });
};

export const postTagDelete = async ({ data, _ids }: HooksParams) => {
	stepLogger({ step: "postTagDelete", params: { data, _ids } });

	//TODO: bookmarks where the tag/s are used should be updated
};
