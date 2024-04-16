// @ts-nocheck
import { getCollection, stepLogger } from "@utils";
import { HandlerFunctionParams } from "./types.ts";

function convertToAtlasSearchQuery(params) {
	stepLogger({
		step: "convertToAtlasSearchQuery",
		params,
	});

	const { queryObject, collection, userId } = params;
	const index = `${collection}-search`;

	const searchQuery = {
		$search: {
			index,
			compound: {
				should: [],
				must: [
					{
						text: {
							query: userId,
							path: "userId",
						},
					},
				],
				mustNot: [],
			},
			highlight: {
				path: [],
			},
		},
	};

	function addToQuery({ operator, field, text }) {
		if (field === "query") {
			let searchFields = [];
			const autocompleteConditions = { compound: { should: [] } };

			if (collection === "bookmarks") {
				searchFields = ["title", "url", "description"];
			} else if (collection === "highlights") {
				searchFields = ["text"];
			}

			searchFields?.forEach((field) => {
				autocompleteConditions.compound.should.push({
					autocomplete: {
						query: text,
						path: field,
					},
				});
			});

			searchQuery.$search.compound.must.push(autocompleteConditions);

			searchQuery.$search.highlight.path = searchFields;
		} else if (field === "parent") {
			const parent = text;
			if (parent !== "") {
				searchQuery.$search.compound.must.push({
					text: { query: text, path: field },
				});
			}
		} else if (operator === "") {
			// Use autocomplete for specified fields
			searchQuery.$search.compound.must.push({
				autocomplete: { query: text, path: field },
			});

			searchQuery.$search.highlight.path.push(field);
		} else {
			const match = {
				text: {
					query: text,
					path: field,
				},
			};

			switch (operator) {
				case "contains":
					searchQuery.$search.compound.must.push(match);
					break;
				case "does not contain":
					searchQuery.$search.compound.mustNot.push(match);
					break;
				default:
					console.error("Unsupported operator");
			}

			searchQuery.$search.highlight.path.push(field);
		}
	}

	Object.keys(queryObject).forEach((field) => {
		let queryField = queryObject[field];
		if (queryField && queryField.text) {
			addToQuery({
				operator: queryField.operator,
				field,
				text: queryField.text,
			});
		}
	});

	searchQuery.$search.compound.should.length === 0 &&
		delete searchQuery.$search.compound.should;
	searchQuery.$search.compound.must.length === 0 &&
		delete searchQuery.$search.compound.must;
	searchQuery.$search.compound.mustNot.length === 0 &&
		delete searchQuery.$search.compound.mustNot;

	return searchQuery;
}

async function performSearch(params) {
	stepLogger({
		step: "performSearch",
		params,
	});

	const { collection, queryObject, userId } = params;

	const searchQuery = convertToAtlasSearchQuery({
		queryObject,
		collection,
		userId,
	});

	const _collection = await getCollection(collection);

	return _collection
		.aggregate([
			searchQuery,
			{
				$project: {
					_id: 1,
					title: 1,
					parent: 1,
					highlights: { $meta: "searchHighlights" },
				},
			},
		])
		.toArray();
}

export const handleSearch = async (params: HandlerFunctionParams) => {
	stepLogger({
		step: "handleSearch",
		params,
	});

	const { requestData, context } = params;

	const { body, userId } = requestData;

	const { collection, queryObject } = body;

	let results = {};

	if (collection === "all") {
		const bookmarksResults = await performSearch({
			collection: "bookmarks",
			queryObject,
			userId,
		});

		const highlightsResults = await performSearch({
			collection: "highlights",
			queryObject,
			userId,
		});

		results = {
			bookmarks: bookmarksResults,
			highlights: highlightsResults,
		};
	} else {
		const searchResults = await performSearch({
			collection,
			queryObject,
			userId,
		});
		results[collection] = searchResults;
	}

	context.response.body = {
		searchResults: results,
	};
};
