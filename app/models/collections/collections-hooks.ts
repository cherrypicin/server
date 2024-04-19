import { stepLogger } from "@utils";
import { HooksParams } from "../types.ts";
import { handleDenoKVOperation } from "@utils";

export const preCollectionGetFilter = async (params: HooksParams) => {
	const { userId } = params;

	// const filter = {
	// 	$or: [{ userId }, { "sharedWith.userId": userId }],
	// };
	const filter = { userId };

	return { filter };
};

export const preCollectionCreate = async (params: HooksParams) => {
	stepLogger({ step: "preCollectionCreate", params });
};

export const preCollectionUpdate = async (params: HooksParams) => {
	const { data, _ids, userId } = params;

	return { updatedIds: _ids, currentData: {} };
};

export const preCollectionDelete = async (params: HooksParams) => {
	const { data } = params;
	stepLogger({ step: "preCollectionDelete", params: { data } });
};

export const postCollectionCreate = async (params: HooksParams) => {
	const { data, userId } = params;

	stepLogger({ step: "postCollectionCreate", params: { data } });

	//@ts-ignore
	await handleDenoKVOperation({
		key: [userId, "collections", data._id],
		value: data._id,
		data: data,
		operation: "create",
	});
};

export const postCollectionUpdate = async (params: HooksParams) => {
	const { data, _ids, arrayOperation, dataInDbBeforeMutation } = params;

	stepLogger({
		step: "postCollectionUpdate",
		params,
	});
};

export const postCollectionDelete = async (params: HooksParams) => {
	const { data, _ids } = params;

	stepLogger({ step: "postCollectionDelete", params });
};
