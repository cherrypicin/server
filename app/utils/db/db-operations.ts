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
	const { mongoDBCollection, filter, sort, page, limit } = params;

	const pipeline = [
		{
			$match: filter,
		},
		{
			$sort: sort,
		},
		{
			$facet: {
				metadata: [{ $count: "total" }],
				//@ts-ignore
				data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
			},
		},
	];

	const result = await mongoDBCollection.aggregate(pipeline).toArray();

	const totalCount =
		result[0].metadata.length > 0 ? result[0].metadata[0].total : 0;
	//@ts-ignore
	const totalPages = Math.ceil(totalCount / limit);

	return {
		data: result[0].data,
		pagination: {
			currentPage: page,
			totalPages: totalPages,
			totalCount: totalCount,
			limit: limit,
		},
	};
};

const updateDocs = async (params: DBOperationParams) => {
	const { mongoDBCollection, data, options, _ids, userId } = params;

	const result = await mongoDBCollection.updateMany(
		//@ts-ignore
		{ _id: { $in: _ids }, userId: userId },
		data
		// options
	);
	return result;
};

const deleteDocs = async (params: DBOperationParams) => {
	const { mongoDBCollection, data, options, _ids, userId } = params;

	const result = await mongoDBCollection.deleteMany(
		//@ts-ignore
		{ _id: { $in: _ids }, userId: userId },
		data
		// options
	);
	return result;
};

const createDoc = async (params: DBOperationParams) => {
	const { mongoDBCollection, data, userId } = params;

	const result = await mongoDBCollection.insertOne({
		...data,
		userId,
	});

	return result;
};

const dbOperations = {
	"get-all-collections": getCollections,
	"get-all-tags": getTags,
	get: getDocs,
	update: updateDocs,
	delete: deleteDocs,
	create: createDoc,
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
