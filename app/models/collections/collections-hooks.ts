import { handleRedisDBOperation, stepLogger } from "@utils";
import { HooksParams } from "../types.ts";
import { Collection } from "../../schemas/collections.ts";

export const preCollectionCreate = async (params: HooksParams) => {
	stepLogger({ step: "preCollectionCreate", params });
};

export const preCollectionUpdate = async (params: HooksParams) => {
	const { data, _ids, userId } = params;

	stepLogger({ step: "preCollectionUpdate", params });

	const dataInCache = await handleRedisDBOperation({
		collection: "collections",
		operation: "get",
		data: data,
		_ids,
	});

	const filteredIds = dataInCache
		.filter((collection: Collection) => {
			const isOwner = collection.userId === userId;

			const isSharedWithEditAccess = collection.sharedWith?.some(
				(shared: any) => shared.userId === userId && shared.access === "edit"
			);

			return isOwner || isSharedWithEditAccess;
		})

		.map((collection: Collection) => collection._id);

	return { updatedIds: filteredIds, currentData: dataInCache };
};

export const preCollectionDelete = async (params: HooksParams) => {
	const { data } = params;
	stepLogger({ step: "preCollectionDelete", params: { data } });
};

export const postCollectionCreate = async (params: HooksParams) => {
	const { data } = params;

	stepLogger({ step: "postCollectionCreate", params: { data } });

	await handleRedisDBOperation({
		collection: "collections",
		operation: "create",
		data: data,
	});
};

export const postCollectionUpdate = async (params: HooksParams) => {
	const { data, _ids, arrayOperation, dataInDbBeforeMutation } = params;

	stepLogger({
		step: "postCollectionUpdate",
		params,
	});

	await handleRedisDBOperation({
		collection: "collections",
		operation: "update",
		data: data,
		_ids,
		arrayOperation,
		dataInDbBeforeMutation,
	});
};

export const postCollectionDelete = async (params: HooksParams) => {
	const { data, _ids } = params;

	stepLogger({ step: "postCollectionDelete", params });

	await handleRedisDBOperation({
		collection: "collections",
		operation: "delete",
		data: data,
		_ids,
	});
};
