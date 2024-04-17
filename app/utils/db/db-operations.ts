import {
	DBOperationParams,
	HandleDBOperationParams,
} from "../../factory/types.ts";
import { stepLogger } from "@utils";
import { getCollection } from "./get-collection.ts";

const getCollections = async (params: DBOperationParams) => {
	const { mongoDBCollection, userId } = params;
	stepLogger({
		step: "getCollections",
		params: "",
	});

	const collections = await mongoDBCollection
		.find({
			$or: [{ userId: userId }, { "sharedWith.userId": userId }],
		})
		.toArray();

	const sharedCollections = collections.filter((collection: any) =>
		collection.sharedWith?.some(
			(sharedWith: any) => sharedWith.userId === userId
		)
	);

	sharedCollections.forEach((sharedCollection: any) => {
		const index = collections.findIndex(
			(collection: any) => collection._id === sharedCollection._id
		);
		if (index !== -1) {
			collections.splice(index, 1);
		}
	});

	return {
		_collections: collections,
		_sharedCollections: sharedCollections,
	};
};

const getTags = async (params: DBOperationParams) => {
	const { mongoDBCollection, userId } = params;

	stepLogger({
		step: "getTags",
		params: "",
	});

	const data = await mongoDBCollection
		.find({
			userId: userId,
		})
		.toArray();

	return data;
};

const getDocs = async (params: DBOperationParams) => {
	const { mongoDBCollection, _ids, userId, filter } = params;

	console.log("mongoDBCollection", filter);

	// if (!_ids || _ids.length === 0) {
	// 	return [];
	// } else {
	const data = await mongoDBCollection
		.find({
			...filter,
		})
		.toArray();

	return data;
	// }
};

const dbOperations = {
	"get-all-collections": getCollections,
	"get-all-tags": getTags,
	get: getDocs,
};

export const handleDBOperation = async (params: HandleDBOperationParams) => {
	const { operation, collection, data, filter } = params;

	stepLogger({
		step: "handleDBOperation",
		params,
	});

	//@ts-ignore
	const dbOperation = dbOperations[operation];

	const mongoDBCollection = await getCollection(collection);

	const document = await dbOperation({
		...params,
		mongoDBCollection,
	});

	return document;
};
