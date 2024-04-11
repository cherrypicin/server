import Ajv from "npm:ajv";
import addFormats from "npm:ajv-formats";

import { getModelMapping } from "@models";
import {
	ValidationError,
	getCollection,
	handleRedisDBOperation,
	stepLogger,
} from "@utils";

import { HandlerFunctionParams } from "./types.ts";

interface handleMutateParams {
	collection: string;
	data: any;
	schema: any;
	hooks: any;
	arrayOperation?: string;
}

export const handleMutate = async ({
	requestData,
	action,
	details,
	context,
}: HandlerFunctionParams) => {
	const { body } = requestData;
	const { collection, operation, data, arrayOperation } = body;

	stepLogger({
		step: "handleMutate",
		params: { collection, operation, data, arrayOperation },
	});

	const result = await handleOperation({
		collection,
		operation,
		data,
		arrayOperation,
	});

	await manageSync({ data, collection, operation });

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
}: {
	data: any;
	collection: string;
	operation: string;
}) => {
	let syncPacket = {
		_id: crypto.randomUUID(),
		data: JSON.stringify(data),
		collection,
		operation,
		userId: 12347,
		updatedAt: new Date(),
		syncId: 1238,
	};

	await handleRedisDBOperation({
		collection: "syncDB",
		operation: "create",
		data: syncPacket,
	});
};

const handleCreate = async ({
	collection,
	data,
	schema,
	hooks,
}: handleMutateParams) => {
	stepLogger({ step: "handleCreate", params: { collection, data } });

	await validateBody({ data, schema });

	if (hooks && hooks.pre) {
		await hooks.pre({ data: data });
	}

	const _collection = await getCollection(collection);
	const result = await _collection.insertOne(data);

	if (hooks && hooks.post) {
		await hooks.post({ data: data });
	}

	return {
		operation: "create",
		data: result.insertedId,
	};
};

const handleUpdate = async ({
	collection,
	data,
	schema,
	hooks,
	arrayOperation,
}: handleMutateParams) => {
	stepLogger({
		step: "handleUpdate",
		params: { collection, data, arrayOperation },
	});

	await validateBody({ data, schema });

	const _collection = await getCollection(collection);
	const { _id, ...rest } = data;
	const _ids = _id.split(",");

	if (hooks && hooks.pre) {
		await hooks.pre({ data: data });
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
		result = await _collection.updateMany({ _id: { $in: _ids } }, updateDoc);
	} else {
		result = await _collection.updateMany({ _id: { $in: _ids } }, updateDoc, {
			// @ts-ignore
			arrayFilters: arrayFilterIdentifiers,
		});
	}

	if (hooks && hooks.post) {
		await hooks.post({ data: rest, _ids: _ids, arrayOperation });
	}

	return { operation: "update", result: result.modifiedCount };
};

const handleDelete = async ({
	collection,
	data,
	hooks,
}: handleMutateParams) => {
	stepLogger({ step: "handleDelete", params: { collection, data } });

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

function convertToDatesUsingSchema({
	data,
	schema,
}: {
	data: any;
	schema: any;
}) {
	stepLogger({ step: "convertToDatesUsingSchema", params: { data, schema } });
	const schemaProperties = schema.properties;

	Object.keys(schemaProperties).forEach((key) => {
		if (schemaProperties[key].format === "date-time" && data[key] != null) {
			data[key] = new Date(data[key]);
		}
	});

	return data;
}

const validateBody = async ({ data, schema }: { data: any; schema: any }) => {
	stepLogger({ step: "validateBody", params: { data, schema } });
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

const handleOperation = async ({
	collection,
	operation,
	data,
	arrayOperation,
}: {
	collection: string;
	operation: string;
	data: any;
	arrayOperation?: string;
}) => {
	stepLogger({
		step: "handleOperation",
		params: { collection, operation, data },
	});
	//@ts-ignore
	const { schema, hooks } = getModelMapping({ collection, operation });

	//@ts-ignore
	const handler = operationHandlers[operation];
	if (!handler) {
		throw new Error("Invalid operation");
	}

	return handler({ collection, data, schema, hooks, arrayOperation });
};
