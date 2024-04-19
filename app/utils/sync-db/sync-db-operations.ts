import { SyncDBError, stepLogger } from "@utils";
import {
	GetSyncPackets,
	HandleRedisDBOperationParams,
	RedisDBOperationsParams,
} from "../../factory/types.ts";
import { getRepository } from "../../connections/sync-db.ts";

export const saveToRepository = async (params: RedisDBOperationsParams) => {
	const { repository, data, ttl } = params;

	stepLogger({
		step: "saveToRepository",
		params,
	});

	if (!repository) {
		throw new Error("Repository not found");
	}

	try {
		await repository.save(data._id, data);
		if (ttl) {
			await repository.expire(data._id, ttl);
		}
	} catch (err) {
		console.log(err);
		throw new SyncDBError("Sync DB Error", err);
	}
};

export const deleteFromRepository = async (params: RedisDBOperationsParams) => {
	const { repository, _ids } = params;

	stepLogger({
		step: "deleteFromRepository",
		params,
	});

	// await repository.delete(data);
	_ids?.forEach(async (_id) => {
		await repository.remove(_id);
	});
};

export const updateInRepository = async (
	params: RedisDBOperationsParams
): Promise<void> => {
	const { repository, data, _ids, arrayOperation, dataInDbBeforeMutation } =
		params;

	stepLogger({
		step: "updateInRepository",
		params,
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
		const keys = path.split(".");
		const lastKey = keys.pop();
		let target = currentData;

		keys.forEach((key) => {
			target[key] = target[key] || {};
			target = target[key];
		});
		if (!lastKey) {
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
		const currentData = dataInDbBeforeMutation.find(
			(item: any) => item._id === _id
		);
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
			await repository.save(_id, updatedData);
		} catch (err) {
			console.error("Error in updateInRepository", err);
		}
	}
};

export const getFromRepository = async (params: RedisDBOperationsParams) => {
	const { repository, _ids } = params;

	stepLogger({
		step: "getFromRepository",
		params,
	});

	//@ts-ignore
	const data = await Promise.all(_ids.map((_id) => repository.fetch(_id)));

	return data;
};

export const getSyncPackets = async (params: GetSyncPackets) => {
	const { repository, fromSyncId, toSyncId } = params;

	stepLogger({
		step: "getSyncPackets",
		params,
	});

	const entities = await repository
		.search()
		.where("userId")
		.eq(12347)
		.where("syncId")
		.between(fromSyncId, toSyncId)
		.return.all();

	return entities;
};

const getAllSessions = async (params: RedisDBOperationsParams) => {
	stepLogger({
		step: "getUserSessions",
		params,
	});

	const { repository, userId } = params;

	if (!userId) {
		throw new Error("User Id not found");
	}

	const sessions = await repository
		.search()
		.where("userId")
		.eq(userId)
		.return.all();
	return sessions;
};

const logOutFromSession = async (params: RedisDBOperationsParams) => {
	stepLogger({
		step: "logOutFromSession",
		params,
	});

	const { repository, data } = params;
	const { _id } = data;

	const sessionIds = _id.split(",");

	sessionIds.forEach(async (sessionId: string) => {
		await repository.remove(sessionId);
	});

	return "Session deleted";
};

const logOutFromAllOtherSessions = async (params: RedisDBOperationsParams) => {
	const { repository, userId, currentSessionId } = params;

	stepLogger({
		step: "logOutFromAllOtherSessions",
		params,
	});
	//@ts-ignore
	const sessions = await getAllSessions({ repository, userId });
	const sessionIds = sessions.map((session: any) => session._id);

	const otherSessions = sessionIds.filter(
		(sessionId: string) => sessionId !== currentSessionId
	);

	otherSessions.forEach(async (sessionId: string) => {
		await repository.remove(sessionId);
	});

	return "Logged out from all other sessions";
};

const redisDBOperations = {
	create: saveToRepository,
	delete: deleteFromRepository,
	update: updateInRepository,
	get: getFromRepository,
	getSyncPackets,
	getAllSessions,
	logOutFromSession,
	logOutFromAllOtherSessions,
};

export const handleRedisDBOperation = async (
	params: HandleRedisDBOperationParams
) => {
	const { operation, collection } = params;

	stepLogger({
		step: "handleRedisDBOperation",
		params,
	});
	// @ts-ignore
	const operationHandler = redisDBOperations[operation];
	if (!operationHandler) {
		throw new Error("Invalid operation for redis db");
	}
	const repository = getRepository(collection);

	try {
		const result = await operationHandler({
			...params,
			repository,
		});

		return result;
	} catch (err) {
		throw new SyncDBError("Sync DB Error", err);
	}
};
