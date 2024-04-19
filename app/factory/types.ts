import { Context } from "oak";

import { RequestData } from "@utils";
import { Repository } from "redis-om";
import { Collection } from "mongodb";

export type Action =
	| "get"
	| "search"
	| "mutate"
	| "full-bootstrap"
	| "delta-sync"
	| "media-management"
	| "session-management"
	| "login"
	| "callback"
	| "logout"
	| "authorization"
	| "access-token"
	| "token";

export interface HandlerFunctionParams {
	requestData: RequestData;
	action: Action;
	details: any;
	context: Context;
}

export type HandlerFunctionResponse = any;

export type HandlerFunction = ({
	requestData,
	action,
	details,
	context,
}: HandlerFunctionParams) => Promise<any>;

export type ActionHandlers = {
	[K in Action]: HandlerFunction;
};

export type HandleOperationParams = {
	arrayOperation?: string;
	collection: string;
	data: any;
	operation: string;
	userId?: string;
	currentSessionId?: any;
};

export interface HandleMutateParams extends HandleOperationParams {
	hooks: any;
	schema: any;
}

export interface HandlePostUpdateParams extends HandleOperationParams {
	_ids?: string[];
	dataInDbBeforeMutation: any;
}

export interface HandleRedisDBOperationParams extends HandlePostUpdateParams {
	fromSyncId?: number;
	toSyncId?: number;
	ttl?: number;
}

export interface RedisDBOperationsParams extends HandleRedisDBOperationParams {
	repository: Repository;
}

export interface GetSyncPackets extends RedisDBOperationsParams {
	fromSyncId: number;
	toSyncId: number;
}

export interface HandleDBOperationParams extends HandleOperationParams {
	_ids?: string[];
	filter?: any;
	sort?: any;
	page?: number;
	limit?: number;
	options?: any;
}

export interface DBOperationParams extends HandleDBOperationParams {
	mongoDBCollection: Collection;
}

export interface HandleRedisCacheOperationParams extends HandleOperationParams {
	key: string;
	data: string;
	ttl?: number;
}
