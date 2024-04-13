import { syncDBRepository } from "@connections";

import { HandlerFunctionParams } from "./types.ts";
import { handleDenoKVOperation } from "@utils";

export const handleDeltaSync = async ({
	requestData,
	context,
}: HandlerFunctionParams) => {
	const { body, userId } = requestData;
	const { fromSyncId, toSyncId } = body;

	//@ts-ignore
	const data = await handleDenoKVOperation({
		operation: "delta-sync",
		fromSyncId,
		toSyncId,
		userId,
	});

	console.log("handleDeltaSync", data);

	//@ts-ignore
	const processData = (data) => {
		// Filter out entries with a null value
		//@ts-ignore
		const validEntries = data.filter((entry) => entry.value !== null);

		// Map over the filtered entries, parse the value, and extract further data
		//@ts-ignore
		const parsedData = validEntries.map((entry) => {
			// Parse the JSON in the value field
			const valueParsed = JSON.parse(entry.value);

			// Attempt to parse the 'data' field within the value if it exists and is a string
			let dataParsed = {};
			if (typeof valueParsed.data === "string") {
				try {
					dataParsed = JSON.parse(valueParsed.data);
				} catch (error) {
					console.error("Error parsing data field:", error);
					dataParsed = { error: "Failed to parse data" };
				}
			}

			// Return a new object with the parsed data and the original key and versionstamp
			return {
				key: entry.key,
				_id: valueParsed._id, // Assuming you might also want to keep the _id from valueParsed
				data: dataParsed,
				versionstamp: entry.versionstamp,
			};
		});

		return parsedData;
	};

	const packetsData = processData(data);

	//@ts-ignore
	context.response.headers.set("Content-Type", "application/json");
	context.response.status = 200;
	context.response.body = {
		data: packetsData,
	};
};
