import { connectToDatabase, connectToRedis } from "./connections/index.ts";
import { Application, Router } from "oak";
import { corsMiddleware, logNetwork } from "@utils";
import { registerRoutes, routes } from "./routes/index.ts";

await connectToDatabase();
await connectToRedis();

const app = new Application();
const router = new Router();

app.use(logNetwork);
app.use(corsMiddleware);

registerRoutes({
	routes,
	router,
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
