import { connectToDatabase, connectToRedis } from "./connections/index.ts";

await connectToDatabase();
await connectToRedis();
