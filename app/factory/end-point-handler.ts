//@ts-nocheck
import { Context } from "oak";
import { getRequestData } from "../utils/server/index.ts";

export function endPointHandler(action: any) {
	return async (context: Context) => {
		const requestData = getRequestData(context);
		context.response.headers.set("Content-Type", "application/json");
		context.response.status = 200;
		context.response.body = `{"message": "Hello from ${action}!"}`;
	};
}
