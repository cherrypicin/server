import { Collection } from "mongodb";

import { connectToDatabase } from "../../connections/db.ts";

export const getCollection = async (
	collectionName: string
): Promise<Collection<any>> => {
	const db = await connectToDatabase();
	return db.collection(collectionName);
};
