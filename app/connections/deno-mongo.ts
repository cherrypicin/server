import { MongoClient } from "deno-mongodb";

// deno-lint-ignore no-explicit-any
let db: any;

export async function connectToDenoMongoDatabase() {
	if (!db) {
		const client = new MongoClient();

		console.log("Connecting to MongoDB...", Deno.env.get("DB_NAME"));
		const DB_PASSWORD = Deno.env.get("DB_PASSWORD");
		const DB_NAME = Deno.env.get("DB_NAME");
		const DB_URL = Deno.env.get("DENO_DB_URL");

		// await client.connect(
		// 	`mongodb+srv://antilibrary-uat:${DB_PASSWORD}@antilibrary-uat.gdpho7d.mongodb.net?authMechanism=SCRAM-SHA-1`
		// );
		await client.connect(`${DB_URL}`);

		console.log("Connected to deno MongoDB");

		const dbName = DB_NAME || "test";
		db = client.database(dbName);
	}
	return db;
}
