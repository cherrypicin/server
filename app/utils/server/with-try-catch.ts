export function withTryCatch<T, Args extends any[]>(
	func: (...args: Args) => Promise<T>,
	errorMessage: string
): (...args: Args) => Promise<T> {
	// Return a function that when called, will execute the original function in a try-catch block.
	return async (...args: Args): Promise<T> => {
		try {
			return await func(...args);
		} catch (err) {
			console.error(errorMessage);
			console.error(err);
			throw err; // Rethrow the error if needed, or handle it as necessary.
		}
	};
}
