import { pack } from "npm:msgpackr@1.10.1";

import { handleRedisDBOperation } from "@utils";
import { HandlerFunctionParams } from "./types.ts";

export const handleDeltaSync = async ({
	requestData,
	context,
}: HandlerFunctionParams) => {
	const { body } = requestData;
	const { fromSyncId, toSyncId, responseFormat } = body;

	if (!fromSyncId || !toSyncId) {
		throw new Error("fromSyncId and toSyncId are required");
	}

	//@ts-ignore
	const entities = await handleRedisDBOperation({
		collection: "sync",
		fromSyncId,
		toSyncId,
		operation: "get_sync_packets",
	});

	//@ts-ignore
	const updatedData = entities.map((entity) => {
		return {
			...entity,
			//@ts-ignore
			data: JSON.parse(entity.data),
		};
	});
	// Setting default response type
	let contentType = "application/json";
	let responseBody;

	// Determine the format for the response
	if (responseFormat && responseFormat.toUpperCase() === "MSGPACK") {
		contentType = "application/bin"; // MIME type for binary data
		responseBody = pack({ data: updatedData });
	} else {
		responseBody = JSON.stringify({ data: updatedData });
	}

	// Setting the response
	context.response.headers.set("Content-Type", contentType);
	context.response.status = 200;
	context.response.body = responseBody;
};
