import { handleDBOperation, stepLogger } from "@utils";
import { HandlerFunctionParams } from "./types.ts";
import { getModelMapping } from "../models/get-model-mapping.ts";

export const handleGet = async (params: HandlerFunctionParams) => {
	const { requestData, context } = params;

	const { body, userId } = requestData;

	const { collection, _id } = body;

	if (collection !== "bookmarks" || collection !== "highlights") {
		//NOTE: get docs by ids for these collections is an internal operation
		throw new Error("Unauthorized access");
	}

	const _ids = _id.split(",");

	let filter;

	//@ts-ignore
	const { hooks } = getModelMapping({ collection, operation: "get" });
	const { pre, post } = hooks;

	if (pre) {
		const preHookResult = await pre({
			userId,
			_ids,
		});
		if (preHookResult.filter) {
			//@ts-ignore
			filter = preHookResult.filter;
		}
	}

	stepLogger({
		step: "handleGet",
		params,
	});

	//@ts-ignore
	const result = await handleDBOperation({
		collection,
		operation: "get",
		userId,
		_ids,
		filter,
	});

	if (post) {
		await post({
			userId,
			data: result,
		});
	}

	context.response.headers.set("Content-Type", "application/json");
	context.response.status = 200;
	context.response.body = {
		result,
	};
};
