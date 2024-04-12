import {
	DBOperationParams,
	HandleDBOperationParams,
} from "../../factory/types.ts";
import { stepLogger } from "@utils";
import { getCollection } from "./get-collection.ts";

const getCollections = async (params: DBOperationParams) => {
	const { mongoDBCollection, userId } = params;

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

	//remove sharedCollections from collections
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

	// stepLogger({
	// 	step: "getTags",
	// 	params: JSON.stringify(params, null, 2),
	// });

	const data = await mongoDBCollection
		.find({
			userId: userId,
		})
		.toArray();

	return data;
};

const getDocsByIds = async (params: DBOperationParams) => {
	const { mongoDBCollection, _ids, userId, filter } = params;

	if (!_ids || _ids.length === 0) {
		return [];
	} else {
		const data = await mongoDBCollection
			.find({
				//@ts-ignore
				_id: { $in: _ids },
				...filter,
			})
			.toArray();

		return data;
	}
};

const dbOperations = {
	"get-all-collections": getCollections,
	"get-all-tags": getTags,
	get: getDocsByIds,
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
