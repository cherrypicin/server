import { handleDBOperation, stepLogger } from "@utils";
import { HandlerFunctionParams } from "./types.ts";
import { getModelMapping } from "../models/get-model-mapping.ts";
import { isGlob } from "https://deno.land/std@0.217.0/path/is_glob.ts";

//@ts-ignore
function convertToMongoDBQuery(queryObject) {
	let query = {} as { [key: string]: any };
	let sort = {};

	// Handle tags
	if (queryObject.tags && queryObject.tags.values) {
		const tagsArray = queryObject.tags.values.split(",");
		switch (queryObject.tags.operator) {
			case "include any of":
				//@ts-ignore
				query.tags = { $in: tagsArray };
				break;
			case "include all of":
				query.tags = { $all: tagsArray };
				break;
			case "exclude if any of":
				query.tags = { $nin: tagsArray };
				break;
			case "exclude if all of":
				// MongoDB doesn't have an 'exclude if all of' operator, but this logic
				// can be replicated using $not with $all to exclude documents that match all tags
				query.tags = { $not: { $all: tagsArray } };
				break;
		}
	}

	// Handle noteColor
	if (queryObject.noteColor && queryObject.noteColor.values) {
		const colorArray = queryObject.noteColor.values.split(",");
		switch (queryObject.noteColor.operator) {
			case "is any of":
				query.noteColor = { $in: colorArray };
				break;
			case "is not any of":
				query.noteColor = { $nin: colorArray };
				break;
			// 'is all of' or 'is none of' cases may not be applicable for a noteColor as it typically has one value
		}
	}

	if (queryObject.color && queryObject.color.values) {
		const colorArray = queryObject.color.values.split(",");
		switch (queryObject.color.operator) {
			case "is any of":
				query.color = { $in: colorArray };
				break;
			case "is not any of":
				query.color = { $nin: colorArray };
				break;
			// 'is all of' or 'is none of' cases may not be applicable for a noteColor as it typically has one value
		}
	}

	// Translate other fields directly
	for (let [key, value] of Object.entries(queryObject)) {
		if (
			typeof value === "string" &&
			value !== "" &&
			!["tags", "noteColor", "sort"].includes(key)
		) {
			//@ts-ignore
			query[key] = value === "true" ? true : value === "false" ? false : value;
		} else if (typeof value === "boolean") {
			//@ts-ignore
			query[key] = value;
		}
	}

	// Handle sorting
	if (queryObject.sort) {
		const field = queryObject.sort.startsWith("-")
			? queryObject.sort.slice(1)
			: queryObject.sort;
		const order = queryObject.sort.startsWith("-") ? -1 : 1;
		//@ts-ignore
		sort[field] = order;
	}

	return { query, sort };
}

export const handleGet = async (params: HandlerFunctionParams) => {
	const { requestData, context } = params;

	const { body, userId } = requestData;

	const { collection, _id, queryObject } = body;

	// console.log("collection", collection);
	// console.log("_id", _id);
	console.log("queryObject", queryObject);

	// if (collection !== "bookmarks" || collection !== "highlights") {
	// 	//NOTE: get docs by ids for these collections is an internal operation
	// 	throw new Error("Unauthorized access");
	// }
	const query = convertToMongoDBQuery(queryObject);
	console.log("query", query);

	let _ids;

	if (_id) {
		_ids = _id.split(",");
	}

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
			filter = {
				...preHookResult.filter,
			};
		}
	}

	filter = {
		...filter,
		...query.query,
	};

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
