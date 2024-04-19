//@ts-nocheck
import { Context } from "oak";
import { load } from "dotenv";

import {
	AuthError,
	ValidationError,
	getRequestData,
	stepLogger,
	RequestData,
	decrypt,
	handleRedisDBOperation,
	verifyJWT,
} from "@utils";

import { ActionHandlers } from "./types.ts";
import { handleDeltaSync } from "./handle-delta-sync.ts";
import { handleFullBootstrap } from "./handle-full-bootstrap.ts";
import { handleGet } from "./handle-get.ts";
import { handleMutate } from "./handle-mutate.ts";
import { handleSearch } from "./handle-search.ts";
import { handleLogin } from "./handle-login.ts";
import { handleSessionManagement } from "./handle-session-management.ts";

const env = await load();

const actionHandlers: ActionHandlers = {
	"delta-sync": handleDeltaSync,
	"full-bootstrap": handleFullBootstrap,
	get: handleGet,
	mutate: handleMutate,
	search: handleSearch,
	login: handleLogin,
	"session-management": handleSessionManagement,
};

const authNotRequired = ["login"];

const isAuthRequired = (action: string) => {
	return !authNotRequired.includes(action);
};

const verifySession = async (params: { session: string }) => {
	stepLogger({ step: "verifySession", params });

	const { session } = params;

	if (!session) {
		throw new AuthError("UnAuthorized - no session error");
	}

	const _sessionData = await handleRedisDBOperation({
		operation: "get",
		collection: "session",
		_ids: [session],
	});

	if (!_sessionData || !_sessionData[0]) {
		throw new AuthError("UnAuthorized - logged out session error");
	}

	const { token, _id } = _sessionData[0];

	try {
		const decodedToken = await verifyJWT({ data: { token } });
		const { email, userId } = decodedToken;

		return { email, userId, currentSessionId: _id };
	} catch (err) {
		throw new AuthError("UnAuthorized-JWT-session deleted error");
	}
};

const handleAuth = async (params: { requestData: RequestData }) => {
	stepLogger({ step: "handleAuth", params });

	const { requestData } = params;
	const { session } = requestData;

	if (!session) {
		throw new AuthError("UnAuthorized");
	}

	const decryptedSessionId = decrypt({
		ciphertext: session,
		key: env["AUTH_SESSION_ENCRYPTION_KEY"],
	});

	const { email, userId, currentSessionId } = await verifySession({
		session: decryptedSessionId,
	});

	return { email, userId, currentSessionId };
};

export function endPointHandler(action: any) {
	return async (context: Context) => {
		let requestData = await getRequestData(context);
		let authenticatedRequestData = {};
		const handler = actionHandlers[action];

		if (!handler) {
			context.response.status = 404;
			context.response.body = "Route Not found";
			return;
		}
		try {
			stepLogger({
				step: "endPointHandler",
				params: { action, requestData },
			});

			if (isAuthRequired(action)) {
				const { email, userId, currentSessionId } = await handleAuth({
					requestData,
				});
				console.log("currentSessionId", currentSessionId);
				authenticatedRequestData = {
					...requestData,
					email,
					userId,
					currentSessionId,
				};
			}

			await handler({
				requestData:
					isAuthRequired(action) && authenticatedRequestData
						? authenticatedRequestData
						: requestData,
				action,
				context,
			});
		} catch (err) {
			console.error(err);

			if (err instanceof ValidationError) {
				console.log("Caught a validation error");
				context.response.status = 400;
				context.response.body = {
					message: err.message,
					details: err.validationErrors,
				};
			} else {
				// Handle general errors
				console.log("error type", typeof err);
				context.response.status = 500;
				context.response.body = {
					message: err.message,
					stack: err.stack,
				};
			}
		}
	};
}
