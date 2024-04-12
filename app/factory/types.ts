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
};

export interface HandleMutateParams extends HandleOperationParams {
	hooks: any;
	schema: any;
}

export interface HandlePostUpdateParams extends HandleOperationParams {
	_ids?: string[];
	dataInDbBeforeMutation: any;
}

export interface RedisDBOperationsParams extends HandlePostUpdateParams {
	repository: Repository;
}

export interface HandleDBOperationParams extends HandleOperationParams {
	_ids?: string[];
	filter?: any;
}

export interface DBOperationParams extends HandleDBOperationParams {
	mongoDBCollection: Collection;
}
