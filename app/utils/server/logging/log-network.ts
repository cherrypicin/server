import { Middleware } from "oak";
import { blue, green, red, yellow } from "colors";

function colorStatus(status: number): string {
	if (status >= 200 && status < 300) {
		return green(status.toString());
	} else if (status >= 300 && status < 400) {
		return yellow(status.toString());
	} else if (status >= 400 && status < 500) {
		return red(status.toString());
	} else {
		return red(status.toString());
	}
}

export const logNetwork: Middleware = async (ctx, next) => {
	console.log("ctx.request ", ctx.request);

	console.log(
		`[${blue(new Date().toISOString())}] [${yellow(ctx.request.method)}] ${
			ctx.request.url
		}`
	);

	const contentType = ctx.request.headers.get("Content-Type");

	if (contentType && contentType.includes("application/json")) {
		console.log("Content-Type: application/json");
		if (ctx.request.hasBody) {
			const requestBody = await ctx.request.body.json();

			console.log(`Request body: ${JSON.stringify(requestBody, null, 2)}`);
		}
	}

	await next();

	console.log(
		`[${blue(new Date().toISOString())}] [${colorStatus(
			ctx.response.status
		)}] ${yellow(ctx.request.method)} ${ctx.request.url}`
	);

	if (ctx.response.body) {
		const responseBody =
			ctx.response.body instanceof Uint8Array
				? new TextDecoder().decode(ctx.response.body)
				: ctx.response.body;
		console.log(`Response body: ${JSON.stringify(responseBody, null, 2)}`);
	}
};
