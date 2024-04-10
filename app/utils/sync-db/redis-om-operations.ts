import { getRepository } from "@connections";
import { SyncDBError, stepLogger } from "@utils";
import { Repository } from "redis-om";

type RedisDBOperationsParams = {
	repository: Repository;
	data: any;
	_ids?: string[];
};

export const saveToRepository = async ({
	repository,
	data,
}: RedisDBOperationsParams) => {
	stepLogger({
		step: "saveToRepository",
		params: { repository, data },
	});
	if (!repository) {
		throw new Error("Repository not found");
	}

	try {
		await repository.save(data._id, data);
	} catch (err) {
		console.log(err);
		throw new SyncDBError("Sync DB Error", err);
	}
};

export const deleteFromRepository = async ({
	repository,
	_ids,
}: RedisDBOperationsParams) => {
	// await repository.delete(data);
	_ids?.forEach(async (_id) => {
		await repository.remove(_id);
	});
};

export const updateInRepository = async ({
	repository,
	data,
	_ids,
}: RedisDBOperationsParams) => {
	_ids?.forEach(async (_id) => {
		const currentData = await repository.fetch(_id);
		const updatedData = { ...currentData, ...data };
		await repository.save(_id, updatedData);
	});
};

const redisDBOperations = {
	create: saveToRepository,
	delete: deleteFromRepository,
	update: updateInRepository,
};

export const handleRedisDBOperation = async ({
	operation,
	collection,
	data,
	_ids,
}: {
	operation: string;
	collection: string;
	data: any;
	_ids?: string[];
}) => {
	stepLogger({
		step: "handleRedisDBOperation",
		params: { operation, collection, data },
	});
	// @ts-ignore
	const operationHandler = redisDBOperations[operation];
	if (!operationHandler) {
		throw new Error("Invalid operation");
	}
	const repository = getRepository(collection);

	try {
		await operationHandler({ repository, data, _ids });
	} catch (err) {
		throw new SyncDBError("Sync DB Error", err);
	}
};
