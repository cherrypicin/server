import { HandleRedisCacheOperationParams } from "../../factory/types.ts";
import { redis } from "@connections";

const setDataInCache = (params: HandleRedisCacheOperationParams) => {
	const { key, data, ttl } = params;
	console.log("setDataInCache", key, data, ttl);
	return redis.set(key, JSON.stringify(data), {
		EX: ttl,
	});
};

const getDataFromCache = (params: HandleRedisCacheOperationParams) => {
	const { key } = params;
	return redis.get(key);
};

const removeKeyFromCache = (params: HandleRedisCacheOperationParams) => {
	const { key } = params;
	return redis.del(key);
};

const cacheOperations = {
	set: setDataInCache,
	get: getDataFromCache,
	remove: removeKeyFromCache,
};

export const handleCacheOperation = async (
	params: HandleRedisCacheOperationParams
) => {
	const { operation, data } = params;

	// @ts-ignore
	const result = await cacheOperations[operation](params);
	return result;
};
