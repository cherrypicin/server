import { handleRedisDBOperation, stepLogger } from "@utils";
import { HooksParams } from "../types.ts";

export const preCollectionCreate = async ({ data }: HooksParams) => {
	stepLogger({ step: "preCollectionCreate", params: { data } });
};

export const preCollectionUpdate = async ({ data }: HooksParams) => {
	stepLogger({ step: "preCollectionUpdate", params: { data } });
};

export const preCollectionDelete = async ({ data }: HooksParams) => {
	stepLogger({ step: "preCollectionDelete", params: { data } });
};

export const postCollectionCreate = async ({ data }: HooksParams) => {
	stepLogger({ step: "postCollectionCreate", params: { data } });
	await handleRedisDBOperation({
		collection: "collections",
		operation: "create",
		data: data,
	});
};

export const postCollectionUpdate = async ({ data, _ids }: HooksParams) => {
	stepLogger({ step: "postCollectionUpdate", params: { data, _ids } });
	await handleRedisDBOperation({
		collection: "collections",
		operation: "update",
		data: data,
		_ids,
	});
};

export const postCollectionDelete = async ({ data, _ids }: HooksParams) => {
	stepLogger({ step: "postCollectionDelete", params: { data, _ids } });
	await handleRedisDBOperation({
		collection: "collections",
		operation: "delete",
		data: data,
		_ids,
	});
};
