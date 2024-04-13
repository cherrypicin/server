import { handleDBOperation, handleRedisDBOperation, stepLogger } from "@utils";
import { HooksParams } from "../types.ts";
import { handleDenoKVOperation } from "@utils";

export const preCollectionGetFilter = async (params: HooksParams) => {
	const { userId } = params;

	const filter = {
		$or: [{ userId }, { "sharedWith.userId": userId }],
	};

	return { filter };
};

export const preCollectionCreate = async (params: HooksParams) => {
	stepLogger({ step: "preCollectionCreate", params });
};

export const preCollectionUpdate = async (params: HooksParams) => {
	const { data, _ids, userId } = params;

	stepLogger({ step: "preCollectionUpdate", params });

	const dataInDenoKV = await handleDenoKVOperation({
		//@ts-ignore
		prefix: [userId, "collections"],
		_ids,
		data,
		operation: "get-keys-by-prefix",
	});

	console.log("dataInDenoKV", dataInDenoKV);
	const _filteredIds = [] as any;

	dataInDenoKV.forEach((item: any) => {
		if (item.value !== null) {
			_filteredIds.push(item.value);
		}
	});

	return { updatedIds: _filteredIds, currentData: {} };
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

	//@ts-ignore
	// await handleRedisDBOperation({
	// 	collection: "collections",
	// 	operation: "create",
	// 	data: data,
	// });
};

export const postCollectionUpdate = async (params: HooksParams) => {
	const { data, _ids, arrayOperation, dataInDbBeforeMutation } = params;

	stepLogger({
		step: "postCollectionUpdate",
		params,
	});

	// await handleRedisDBOperation({
	// 	collection: "collections",
	// 	operation: "update",
	// 	data: data,
	// 	_ids,
	// 	arrayOperation,
	// 	dataInDbBeforeMutation,
	// });
};

export const postCollectionDelete = async (params: HooksParams) => {
	const { data, _ids } = params;

	stepLogger({ step: "postCollectionDelete", params });

	await handleRedisDBOperation({
		collection: "collections",
		operation: "delete",
		data: data,
		_ids,
		dataInDbBeforeMutation: [],
	});
};
