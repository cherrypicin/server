import Ajv from "npm:ajv";
import addFormats from "npm:ajv-formats";

import { syncDBRepository } from "@connections";
import { ValidationError, getCollection } from "@utils";
import { TagSchema } from "@schemas";

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

	const result = await handleOperation({ collection, operation, data });

	let syncPacket = {
		data: JSON.stringify(data),
		collection,
		operation,
		userId: 12347,
		updatedAt: new Date(),
		syncId: 1238,
	};

	try {
		await syncDBRepository.save(syncPacket);
	} catch (error) {
		console.error("Error syncing to DB", error);
	}

	// Querying by syncId range -
	//@ts-ignore
	async function queryBySyncIdRange(repository, startSyncId, endSyncId) {
		// This assumes that `startSyncId` and `endSyncId` are inclusive bounds for the query range
		const entities = await syncDBRepository
			.search()
			.where("userId")
			.eq(1234)
			.where("syncId")
			.between(startSyncId, endSyncId)
			.sortBy("updatedAt", "ASC")
			.return.all();

		return entities;
	}

	const entities = await queryBySyncIdRange(syncDBRepository, 1234, 1238);

	//@ts-ignore
	context.response.headers.set("Content-Type", "application/json");
	context.response.status = 200;
	context.response.body = {
		...result,
		syncId: 1234,
		entities,
	};
};

const handleCreate = async ({
	collection,
	data,
	schema,
	hooks,
}: handleMutateParams) => {
	await validateBody({ data, schema });

	const _collection = await getCollection(collection);
	const result = await _collection.insertOne(data);

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
	await validateBody({ data, schema });

	const _collection = await getCollection(collection);
	const { _id, ...rest } = data;
	const _ids = data._id.split(",");

	const result = await _collection.updateMany(
		{ _id: { $in: _ids } },
		{ $set: rest }
	);
	return { operation: "update", data: result.modifiedCount };
};

const handleDelete = async ({
	collection,
	data,
	schema,
	hooks,
}: handleMutateParams) => {
	const _collection = await getCollection(collection);
	const _ids = data._id.split(",");
	const result = await _collection.deleteMany({ _id: { $in: _ids } });

	return { operation: "delete", data: result.deletedCount };
};

function convertToDatesUsingSchema({
	data,
	schema,
}: {
	data: any;
	schema: any;
}) {
	const schemaProperties = schema.properties;

	Object.keys(schemaProperties).forEach((key) => {
		if (schemaProperties[key].format === "date-time" && data[key] != null) {
			data[key] = new Date(data[key]);
		}
	});

	return data;
}

const validateBody = async ({ data, schema }: { data: any; schema: any }) => {
	//@ts-ignore
	const ajv = new Ajv({
		allErrors: true,
		// verbose: true,
	});
	//@ts-ignore
	addFormats(ajv);

	const validate = ajv.compile(TagSchema);
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
	const schema = TagSchema;
	const hooks = {};

	//@ts-ignore
	const handler = operationHandlers[operation];
	if (!handler) {
		throw new Error("Invalid operation");
	}

	return handler({ collection, data, schema, hooks });
};
