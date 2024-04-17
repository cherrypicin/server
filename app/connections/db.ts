import { MongoClient } from "mongodb";
import { load } from "dotenv";

import { withTryCatch } from "@utils";

const env = await load();
let db: any;

export const connectToDatabase = withTryCatch(async () => {
	if (!db) {
		console.log("Connecting to database...");
		console.log("DB_URL", env["DB_URL"]);
		const DB_URL = env["DB_URL"] as string;

		try {
			const client = new MongoClient(DB_URL);
			await client.connect();

			db = client.db(env["DB_NAME"]);

			console.log("Connected to database");
		} catch (err) {
			console.log("error", err);
		}
	}
	return db;
}, "connection error - Failed to connect to database");
