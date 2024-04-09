import { Context } from "oak";

import { RequestData } from "@utils";

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
