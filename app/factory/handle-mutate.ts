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
}

export const handleMutate = async ({
	requestData,
	action,
	details,
	context,
}: HandlerFunctionParams) => {
	const { body } = requestData;
	const { collection, operation, data } = body;

	stepLogger({ step: "handleMutate", params: { collection, operation, data } });

	const result = await handleOperation({ collection, operation, data });

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
}: handleMutateParams) => {
	stepLogger({ step: "handleUpdate", params: { collection, data } });
	await validateBody({ data, schema });

	const _collection = await getCollection(collection);
	const { _id, ...rest } = data;
	const _ids = data._id.split(",");

	if (hooks && hooks.pre) {
		await hooks.pre({ data: data });
	}

	const result = await _collection.updateMany(
		{ _id: { $in: _ids } },
		{ $set: rest }
	);

	if (hooks && hooks.post) {
		await hooks.post({ data: rest, _ids: _ids });
	}

	return { operation: "update", data: result.modifiedCount };
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
}: {
	collection: string;
	operation: string;
	data: any;
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

	return handler({ collection, data, schema, hooks });
};
