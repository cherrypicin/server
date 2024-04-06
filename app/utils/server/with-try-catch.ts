import { load } from "dotenv";
import { logError } from "@utils";

const env = await load();

export function withTryCatch<T, Args extends any[]>(
	func: (...args: Args) => Promise<T>,
	errorMessage: string
): (...args: Args) => Promise<T> {
	//@ts-ignore
	return async (...args: Args): Promise<T> => {
		try {
			return await func(...args);
		} catch (err) {
			if (env["ENV"] === "dev") {
				console.error(errorMessage);
				console.log("stack", err.stack);
			} else {
				logError({
					errorMessage,
					errorStack: err.stack,
				});
				console.error(errorMessage);
			}
			return Promise.reject(errorMessage);
		}
	};
}
