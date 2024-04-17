import Ajv from "npm:ajv";
import addFormats from "npm:ajv-formats";

import { getModelMapping } from "@models";

import {
	ValidationError,
	getCollection,
	stepLogger,
	handleRedisDBOperation,
	handleDBOperation,
} from "@utils";

import {
	HandleOperationParams,
	HandlerFunctionParams,
	HandleMutateParams,
} from "./types.ts";

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
	stepLogger({
		step: "manageSync",
		params: {
			data,
			collection,
		},
	});

	const syncIdInDB = Math.floor(Math.random() * 100) + 1000;

	let syncPacket = {
		_id: crypto.randomUUID(),
		data: JSON.stringify(data),
		collection,
		operation,
		userId,
		updatedAt: new Date(),
		syncId: syncIdInDB,
	};

	// @ts-ignore
	await handleRedisDBOperation({
		collection: "syncDB",
		operation: "create",
		data: syncPacket,
		userId: "12347",
	});
};

const handleCreate = async (params: HandleMutateParams) => {
	const { collection, data, hooks, schema, userId } = params;

	stepLogger({ step: "handleCreate", params });

	await validateBody({ data, schema });

	if (hooks && hooks.pre) {
		await hooks.pre(params);
	}

	const result = await handleDBOperation({
		operation: "create",
		collection,
		data,
		userId,
	});

	if (hooks && hooks.post) {
		await hooks.post(params);
	}

	return {
		operation: "create",
		data: result.insertedId,
	};
};

const convertToMongoDBUpdate = (params: any) => {
	const { data, arrayOperation } = params;
	const { _id, ...rest } = data;

	let updateDoc = { $set: {}, $addToSet: {}, $pull: {} };

	let arrayFilterIdentifiers = [] as any;

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

	["$addToSet", "$pull", "$set"].forEach((op) => {
		//@ts-ignore
		if (Object.keys(updateDoc[op]).length === 0) delete updateDoc[op];
	});

	return {
		_id,
		updateDoc,
		arrayFilterIdentifiers,
	};
};

const handleUpdate = async (params: HandleMutateParams) => {
	const { collection, data, hooks, schema, arrayOperation, userId } = params;

	stepLogger({
		step: "handleUpdate",
		params,
	});

	await validateBody({ data, schema });

	const { _id, ...rest } = data;

	let _ids = _id.split(",");

	if (hooks && hooks.pre) {
	}

	const { updateDoc, arrayFilterIdentifiers } = convertToMongoDBUpdate({
		data,
		arrayOperation,
	});

	console.log("updateDoc", JSON.stringify(updateDoc, null, 2));

	let result;

	result = await handleDBOperation({
		operation: "update",
		collection,
		data: updateDoc,
		_ids,
		userId,
		options: {
			// @ts-ignore
			arrayFilters: arrayFilterIdentifiers,
		},
	});

	if (hooks && hooks.post) {
		await hooks.post({
			data: rest,
			_ids: _ids,
			arrayOperation,
		});
	}

	return { operation: "update", result: result };
};

const handleDelete = async (params: HandleMutateParams) => {
	const { collection, data, hooks, userId } = params;

	stepLogger({ step: "handleDelete", params });

	const _ids = data._id.split(",");

	if (hooks && hooks.pre) {
		await hooks.pre({ data: data });
	}

	//@ts-ignore
	const result = await handleDBOperation({
		operation: "delete",
		collection,
		_ids,
		userId,
	});

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
