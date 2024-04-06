import { connectToDatabase, connectToRedis } from "./connections/index.ts";
import { Application, Context } from "oak";
import { logNetwork } from "@utils";

await connectToDatabase();
await connectToRedis();

const app = new Application();

app.use(logNetwork);

app.use(async (ctx: Context) => {
	ctx.response.body = "Hello world!";
});

await app.listen({ port: 8000 });
