import { handleDBOperation, stepLogger } from "@utils";
import { HandlerFunctionParams } from "./types.ts";

export const handleFullBootstrap = async (params: HandlerFunctionParams) => {
	const { requestData, context } = params;
	const { body, userId } = requestData;
	const { collection } = body;

	const collectionsInRequest = collection.split(",");

	if (collectionsInRequest.length === 0) {
		throw new Error("Invalid request");
	}

	let collections;
	let sharedCollections;
	let tags;

	if (collectionsInRequest.includes("collections")) {
		//@ts-ignore
		const { _collections, _sharedCollections } = await handleDBOperation({
			collection: "collections",
			operation: "get-all-collections",
			userId,
		});
		collections = _collections;
		sharedCollections = _sharedCollections;
	}

	if (collectionsInRequest.includes("tags")) {
		//@ts-ignore
		tags = await handleDBOperation({
			collection: "tags",
			operation: "get-all-tags",
			userId,
		});
	}

	stepLogger({
		step: "handleFullBootstrap",
		params,
	});

	context.response.headers.set("Content-Type", "application/json");
	context.response.status = 200;
	context.response.body = {
		//@ts-ignore
		data: {
			collections,
			sharedCollections,
			tags,
		},
	};
};
