//@ts-nocheck
import { Context } from "oak";

import { ValidationError, getRequestData, stepLogger } from "@utils";

import { handleMutate } from "./handle-mutate.ts";
import { handleDeltaSync } from "./handle-delta-sync.ts";
import { ActionHandlers } from "./types.ts";
import { handleGet } from "./handle-get.ts";
import { handleFullBootstrap } from "./handle-full-bootstrap.ts";
import { handleSearch } from "./handle-search.ts";

const actionHandlers: ActionHandlers = {
	mutate: handleMutate,
	"delta-sync": handleDeltaSync,
	"full-bootstrap": handleFullBootstrap,
	get: handleGet,
	search: handleSearch,
};

export function endPointHandler(action: any) {
	return async (context: Context) => {
		const requestData = await getRequestData(context);
		const handler = actionHandlers[action];
		if (!handler) {
			context.response.status = 404;
			context.response.body = "Not found";
			return;
		}
		try {
			stepLogger({
				step: "endPointHandler",
				params: { action, requestData },
			});
			await handler({ requestData, action, context });
		} catch (err) {
			console.error(err);

			if (err instanceof ValidationError) {
				console.log("Caught a validation error");
				context.response.status = 400;
				context.response.body = {
					message: err.message,
					details: err.validationErrors,
				};
			} else {
				// Handle general errors
				console.log("error type", typeof err);
				context.response.status = 500;
				context.response.body = {
					message: err.message,
					stack: err.stack,
				};
			}
		}
	};
}
