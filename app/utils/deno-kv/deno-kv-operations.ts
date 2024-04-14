import { connectToDenoKV } from "@connections";
import { stepLogger } from "../server/index.ts";

export type DenoKVOperationParams = {
	key?: string[];
	data: any;
	prefix?: string[];
	_ids?: string[];
	value: string;
	fromSyncId?: number;
	toSyncId?: number;
	userId?: string;
};

export const createKey = async (params: DenoKVOperationParams) => {
	const { data, key, value } = params;

	stepLogger({ step: "createDocument", params });

	const kv = await connectToDenoKV();

	if (kv && key) {
		await kv.set(key, value);
	}
};

export const getMany = async (params: DenoKVOperationParams) => {
	const { key, _ids, prefix } = params;

	stepLogger({ step: "getKeysByPrefix", params });

	const kv = await connectToDenoKV();
	//@ts-ignore
	let keys = [] as any;

	if (prefix && _ids) {
		keys = _ids?.map((_id) => [...prefix, _id]);
	}

	if (kv && keys) {
		const data = await kv.getMany(keys, { consistency: "eventual" });
		return data;
	}
};

export const getDeltaSyncPackets = async (params: DenoKVOperationParams) => {
	const { fromSyncId, toSyncId, userId } = params;
	stepLogger({ step: "getDeltaSyncPackets", params });

	const kv = await connectToDenoKV();

	const prefix = [userId, "syncDB"];

	// Create an array of sync IDs based on the range from fromSyncId to toSyncId
	const syncIds = [];
	//@ts-ignore
	for (let id = fromSyncId; id <= toSyncId; id++) {
		syncIds.push(id);
	}

	// Generate the keys array by appending each sync ID to the prefix
	if (kv && prefix && syncIds.length) {
		const keysArray = syncIds.map((syncId) => [
			...prefix,
			JSON.stringify(syncId),
		]);

		//@ts-ignore
		const data = await kv?.getMany(keysArray);

		return data;
	}
};

export const getDataBykey = async (params: DenoKVOperationParams) => {
	const { key } = params;

	stepLogger({ step: "getDataBykey", params });

	const kv = await connectToDenoKV();

	if (kv && key) {
		const data = await kv.get(key);
		return data;
	}
};

const denoKVOperations = {
	create: createKey,
	"get-keys-by-prefix": getMany,
	get: getDataBykey,
	"delta-sync": getDeltaSyncPackets,
};

export type HandleDenoKVOperations = {
	operation: string;
	key: string[];
	value: string;
	data: any;
	prefix: string[];
	_ids?: string[];
	fromSyncId?: number;
	toSyncId?: number;
	userId?: string;
};

export const handleDenoKVOperation = async (params: HandleDenoKVOperations) => {
	const { operation } = params;

	stepLogger({ step: "handleDenoKVOperation", params });

	try {
		//@ts-ignore
		const data = await denoKVOperations[operation](params);
		return data;
	} catch (e) {
		console.error(e);
		stepLogger({
			step: "handleDenoKVOperation",
			params: { error: e },
		});
	}
};
