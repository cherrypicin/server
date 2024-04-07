import { Context } from "oak";

export function endPointHandler(action: any) {
	console.log("endPointHandler", action);
	return async (context: Context) => {
		console.log("endPointHandler", action, context.request.url.pathname);
		context.response.headers.set("Content-Type", "application/json");
		context.response.status = 200;
		context.response.body = `{"message": "Hello from ${action}!"}`;
	};
}
