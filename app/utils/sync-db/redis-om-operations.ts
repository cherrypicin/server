import { getRepository } from "@connections";
import { SyncDBError, stepLogger } from "@utils";
import { Repository } from "redis-om";

type RedisDBOperationsParams = {
	repository: Repository;
	data: any;
	_ids?: string[];
	arrayOperation?: string;
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
	arrayOperation,
}: RedisDBOperationsParams): Promise<void> => {
	stepLogger({
		step: "updateInRepository",
		params: { repository, data, _ids, arrayOperation },
	});

	const updateAtPath = ({
		currentData,
		path,
		arrayOperation,
		value,
	}: {
		currentData: any;
		path: string;
		arrayOperation: string;
		value: any;
	}) => {
		console.log("updateAtPath", { currentData, path, arrayOperation, value });
		const keys = path.split(".");
		const lastKey = keys.pop();
		let target = currentData;

		keys.forEach((key) => {
			target[key] = target[key] || {};
			target = target[key];
		});
		if (!lastKey) {
			console.log("updateAtPath_lastKey", { target, lastKey, value });
			return;
		}
		if (arrayOperation === "add" && Array.isArray(value)) {
			target[lastKey] = target[lastKey] || [];
			const newItems = new Set([...target[lastKey], ...value]);

			target[lastKey] = Array.from(newItems);
		} else if (arrayOperation === "remove" && Array.isArray(value)) {
			if (Array.isArray(target[lastKey])) {
				target[lastKey] = target[lastKey].filter(
					//@ts-ignore
					(item) => !value.includes(item)
				);
			}
		} else {
			console.log("updateAtPath_else", { target, lastKey, value });
			//@ts-ignore
			target[lastKey] = value;
		}
	};

	//@ts-ignore
	const handleArrayOperation = ({ currentData, path, operation, value }) => {
		stepLogger({
			step: "handleArrayOperation",
			params: { currentData, path, operation, value },
		});

		let targetArray = currentData[path] || [];

		switch (operation) {
			case "add":
				// Assuming 'value' is an array of objects to be added
				//@ts-ignore
				value.forEach((item) => {
					//@ts-ignore
					if (!targetArray.find((element) => element.userId === item.userId)) {
						targetArray.push(item);
					}
				});
				break;
			case "remove":
				// Assuming 'value' is an array of _id's to be removed
				//@ts-ignore
				value.forEach((item) => {
					const index = targetArray.findIndex(
						//@ts-ignore
						(element) => element.userId === item.userId
					);
					if (index !== -1) {
						targetArray.splice(index, 1);
					}
				});

				break;
			case "update":
				// Assuming 'value' is an array of objects with _id's for updating existing items
				if (value.length === 0) {
					targetArray = [];
				} else {
					//@ts-ignore
					value.forEach((updateItem) => {
						const index = targetArray.findIndex(
							//@ts-ignore
							(item) => item.userId === updateItem.userId
						);
						if (index !== -1) {
							targetArray[index] = { ...targetArray[index], ...updateItem };
						}
					});
				}
				break;
		}

		currentData[path] = targetArray;
	};

	if (!_ids) {
		throw new Error("No _ids provided");
	}

	for (const _id of _ids) {
		const currentData = await repository.fetch(_id);
		let updatedData = { ...currentData };

		Object.entries(data).forEach(([path, value]) => {
			if (path !== "_id") {
				if (path === "sharedWith" || path === "annotation") {
					handleArrayOperation({
						currentData: updatedData,
						path,
						operation: arrayOperation,
						value,
					});
				} else {
					updateAtPath({
						// @ts-ignore
						arrayOperation,
						currentData: updatedData,
						path,
						value,
					});
				}
			}
		});

		try {
			console.log("Saving updated data", updatedData);
			await repository.save(_id, updatedData);
		} catch (err) {
			console.error("Error in updateInRepository", err);
		}
	}
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
	arrayOperation,
}: {
	operation: string;
	collection: string;
	data: any;
	_ids?: string[];
	arrayOperation?: string;
}) => {
	stepLogger({
		step: "handleRedisDBOperation",
		params: { operation, collection, data, arrayOperation },
	});
	// @ts-ignore
	const operationHandler = redisDBOperations[operation];
	if (!operationHandler) {
		throw new Error("Invalid operation");
	}
	const repository = getRepository(collection);

	try {
		await operationHandler({ repository, data, _ids, arrayOperation });
	} catch (err) {
		console.log("redis ops", err);
		throw new SyncDBError("Sync DB Error", err);
	}
};
