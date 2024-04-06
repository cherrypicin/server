import { load } from "dotenv";
const env = await load();

export async function logError({
	errorStack,
	errorMessage,
}: {
	errorStack: string;
	errorMessage: string;
}) {
	const newRelicUrl = `https://log-api.newrelic.com/log/v1`;

	const headers = new Headers({
		"Content-Type": "application/json",
		"Api-Key": env["NEW_RELIC_API_KEY"] as string,
	});

	const logEntry = {
		app: "server",
		environment: env["ENV"],
		message: errorMessage,
		error_stack: "Error: " + errorMessage + "\n" + errorStack,
		timestamp: new Date().toISOString(),
	};

	try {
		const response = await fetch(newRelicUrl, {
			method: "POST",
			headers: headers,
			body: JSON.stringify([logEntry]),
		});

		if (!response.ok) {
			console.error("Failed to log the error", await response.text());
		}
	} catch (error) {
		console.error("Error sending log", error);
	}
}
