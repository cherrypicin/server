import Ajv from "npm:ajv";
import addFormats from "npm:ajv-formats";

import { getModelMapping } from "@models";
import { ValidationError, getCollection, stepLogger } from "@utils";

import {
	HandleOperationParams,
	HandlerFunctionParams,
	HandleMutateParams,
} from "./types.ts";
import { handleDenoKVOperation } from "@utils";

export const handleMutate = async (params: HandlerFunctionParams) => {
	const { requestData, context } = params;

	const { body, userId } = requestData;
	const { collection, operation, data, arrayOperation } = body;

	stepLogger({
		step: "handleMutate",
		params,
	});

	const result = await handleOperation({
		collection,
		operation,
		data,
		arrayOperation,
		userId,
	});

	await manageSync({ data, collection, operation, userId });

	//@ts-ignore
	context.response.headers.set("Content-Type", "application/json");
	context.response.status = 200;
	context.response.body = {
		...result,
		syncId: 1234,
	};
};

const manageSync = async ({
	data,
	collection,
	operation,
	userId,
}: {
	data: any;
	collection: string;
	operation: string;
	userId: string;
}) => {
	const syncId = 1;

	// const _syncId = await handleDenoKVOperation({
	// 	operation: "get",
	// 	key: [userId, "syncId"],
	// 	value: JSON.stringify(1),
	// 	data,
	// 	prefix: [],
	// });

	// console.log("syncId", _syncId);

	// const syncIdInDB = _syncId ? Number(_syncId.value) + 1 : 0;

	// console.log("syncIdInDB", syncIdInDB);

	let syncPacket = {
		_id: crypto.randomUUID(),
		data: JSON.stringify(data),
		collection,
		operation,
		userId,
		updatedAt: new Date(),
		syncId: 1,
	};

	await handleDenoKVOperation({
		operation: "create",
		key: [userId, "syncDB", JSON.stringify(1)],
		value: JSON.stringify(syncPacket),
		data: syncPacket,
		prefix: [],
	});

	// await handleDenoKVOperation({
	// 	operation: "create",
	// 	key: [userId, "syncId"],
	// 	value: JSON.stringify(1),
	// 	data: syncPacket,
	// 	prefix: [],
	// });

	//@ts-ignore
	// await handleRedisDBOperation({
	// 	collection: "syncDB",
	// 	operation: "create",
	// 	data: syncPacket,
	// 	userId: "12347",
	// });
};

const handleCreate = async (params: HandleMutateParams) => {
	const { collection, data, hooks, schema } = params;

	stepLogger({ step: "handleCreate", params });

	await validateBody({ data, schema });

	if (hooks && hooks.pre) {
		await hooks.pre(params);
	}

	const _collection = await getCollection(collection);
	const result = await _collection.insertOne(data);

	if (hooks && hooks.post) {
		await hooks.post(params);
	}

	return {
		operation: "create",
		data: result.insertedId,
	};
};

const handleUpdate = async (params: HandleMutateParams) => {
	const { collection, data, hooks, schema, arrayOperation, userId } = params;

	stepLogger({
		step: "handleUpdate",
		params,
	});

	await validateBody({ data, schema });

	const _collection = await getCollection(collection);

	const { _id, ...rest } = data;

	let _ids = _id.split(",");
	// let dataInDbBeforeMutation = [];

	if (hooks && hooks.pre) {
		// const { updatedIds, currentData } = await hooks.pre({
		// 	data,
		// 	collection,
		// 	_ids,
		// 	userId,
		// });
		// _ids = updatedIds;
		// dataInDbBeforeMutation = currentData;
	}

	let updateDoc = { $set: {}, $addToSet: {}, $pull: {} };
	//@ts-ignore
	let arrayFilterIdentifiers = [];

	Object.entries(rest).forEach(([key, value]) => {
		if (
			key === "sharedWith" &&
			arrayOperation === "update" &&
			Array.isArray(value)
		) {
			if (value.length === 0) {
				//@ts-ignore
				updateDoc.$set[key] = [];
				return;
			} else {
				value.forEach((item, index) => {
					if (item.userId) {
						const filterIdentifier = `elem${index}`;
						arrayFilterIdentifiers.push({
							[`${filterIdentifier}.userId`]: item.userId,
						});

						Object.keys(item).forEach((field) => {
							//@ts-ignore
							updateDoc.$set[`sharedWith.$[${filterIdentifier}].${field}`] =
								item[field];
						});
					}
				});
			}
		} else if (
			key === "sharedWith" &&
			arrayOperation === "remove" &&
			Array.isArray(value)
		) {
			value.forEach((item) => {
				if (item.userId) {
					updateDoc.$pull = {
						[key]: { userId: item.userId },
					};
				}
			});
		} else if (
			key === "annotation" &&
			arrayOperation === "update" &&
			Array.isArray(value)
		) {
			// Special handling for 'annotation' or similar arrays
			value.forEach((item, index) => {
				if (item._id) {
					// Construct a filter identifier and condition
					const filterIdentifier = `elem${index}`;
					arrayFilterIdentifiers.push({
						[`${filterIdentifier}._id`]: item._id,
					});

					// Construct the update operation using the filter identifier
					Object.keys(item).forEach((field) => {
						//@ts-ignore
						updateDoc.$set[`annotation.$[${filterIdentifier}].${field}`] =
							item[field];
					});
				}
			});
		} else if (
			key === "annotation" &&
			arrayOperation === "remove" &&
			Array.isArray(value)
		) {
			value.forEach((item) => {
				if (item._id) {
					updateDoc.$pull = {
						[key]: { _id: item._id },
					};
				}
			});
		} else if (arrayOperation === "add" && Array.isArray(value)) {
			//@ts-ignore
			updateDoc.$addToSet[key] = { $each: value };
		} else if (arrayOperation === "remove" && Array.isArray(value)) {
			//@ts-ignore
			updateDoc.$pull[key] = { $in: value };
		} else {
			//@ts-ignore
			updateDoc.$set[key] = value;
		}
	});

	// Clean up unused operators
	["$addToSet", "$pull", "$set"].forEach((op) => {
		//@ts-ignore
		if (Object.keys(updateDoc[op]).length === 0) delete updateDoc[op];
	});

	console.log("handleUpdate-updateDoc", JSON.stringify(updateDoc, null, 2));

	let result;
	// Perform the update
	if (arrayFilterIdentifiers.length === 0) {
		result = await _collection.updateMany(
			{ _id: { $in: _ids }, userId: "12347" },
			updateDoc
		);
	} else {
		result = await _collection.updateMany({ _id: { $in: _ids } }, updateDoc, {
			// @ts-ignore
			arrayFilters: arrayFilterIdentifiers,
			explain: true,
		});
	}

	if (hooks && hooks.post) {
		await hooks.post({
			data: rest,
			_ids: _ids,
			arrayOperation,
			// dataInDbBeforeMutation,
		});
	}

	return { operation: "update", result: result };
};

const handleDelete = async (params: HandleMutateParams) => {
	const { collection, data, hooks } = params;

	stepLogger({ step: "handleDelete", params });

	const _collection = await getCollection(collection);
	const _ids = data._id.split(",");

	if (hooks && hooks.pre) {
		await hooks.pre({ data: data });
	}

	const result = await _collection.deleteMany({ _id: { $in: _ids } });

	if (hooks && hooks.post) {
		await hooks.post({ data, _ids });
	}

	return { operation: "delete", data: result.deletedCount };
};

function convertToDatesUsingSchema(params: { data: any; schema: any }) {
	const { data, schema } = params;

	stepLogger({ step: "convertToDatesUsingSchema", params });
	const schemaProperties = schema.properties;

	Object.keys(schemaProperties).forEach((key) => {
		if (schemaProperties[key].format === "date-time" && data[key] != null) {
			data[key] = new Date(data[key]);
		}
	});

	return data;
}

const validateBody = async (params: { data: any; schema: any }) => {
	const { data, schema } = params;

	stepLogger({ step: "validateBody", params });
	//@ts-ignore
	const ajv = new Ajv({
		allErrors: true,
		// verbose: true,
	});
	//@ts-ignore
	addFormats(ajv);

	const validate = ajv.compile(schema);
	const valid = validate(data);
	if (!valid) {
		throw new ValidationError("Validation error", validate.errors);
	}

	convertToDatesUsingSchema({ data, schema });

	return true;
};

const operationHandlers = {
	create: handleCreate,
	update: handleUpdate,
	delete: handleDelete,
};

const handleOperation = async (params: HandleOperationParams) => {
	const { collection, operation, data, arrayOperation, userId } = params;

	stepLogger({
		step: "handleOperation",
		params,
	});
	//@ts-ignore
	const { schema, hooks } = getModelMapping({ collection, operation });

	//@ts-ignore
	const handler = operationHandlers[operation];
	if (!handler) {
		throw new Error("Invalid operation");
	}

	return handler({ ...params, schema, hooks });
};
