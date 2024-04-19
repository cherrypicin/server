import { handleRedisDBOperation, stepLogger } from "@utils";
import { HandlerFunctionParams } from "./types.ts";

const getAllSessions = async (params: any) => {
	stepLogger({ step: "getAllSessions", params });

	const { userId, currentSessionId } = params;
	//@ts-ignore
	const _sessions = await handleRedisDBOperation({
		operation: "getAllSessions",
		collection: "session",
		userId,
	});

	const sessions = _sessions.map((session: any) => {
		return {
			_id: session._id,
			deviceDetails: session.deviceDetails,
			timeZone: session.timeZone,
			isCurrentSession: session._id === currentSessionId,
		};
	});

	return sessions;
};

const logoutFromAllOtherSessions = async (params: any) => {
	stepLogger({ step: "logOutFromAllSessions", params });

	const { userId, data, currentSessionId } = params;

	//@ts-ignore
	const result = await handleRedisDBOperation({
		operation: "logOutFromAllOtherSessions",
		collection: "session",
		userId,
		data,
		currentSessionId,
	});

	return result;
};

const logoutFromSession = async (params: any) => {
	stepLogger({ step: "logOutFromSession", params });

	const { userId, data, currentSessionId } = params;

	//@ts-ignore
	const result = await handleRedisDBOperation({
		operation: "logOutFromSession",
		collection: "session",
		userId,
		data,
		currentSessionId,
	});

	return result;
};

const sessionHandlers = {
	getAllSessions: getAllSessions,
	logoutFromAllOtherSessions: logoutFromAllOtherSessions,
	logoutFromSession: logoutFromSession,
};

export const handleSessionManagement = async (
	params: HandlerFunctionParams
) => {
	const { context, requestData } = params;

	const { body } = params.requestData;
	const { data, operation } = body;

	try {
		//@ts-ignore
		const handler = sessionHandlers[operation];

		if (!handler) {
			throw new Error("Invalid operation for session management");
		}

		const session = await handler({
			...requestData,
			data,
			operation,
		});

		context.response.body = session;
		context.response.status = 200;
	} catch (error) {
		context.response.body = {
			error: error.message,
		};

		context.response.status = 400;
	}
};
