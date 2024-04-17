import { Application, Router } from "oak";

import {
	connectToDatabase,
	connectToRedis,
	connectToDenoKV,
	connectToDenoMongoDatabase,
} from "@connections";
import { corsMiddleware, logNetwork } from "@utils";
import { registerRoutes, routes } from "@routes";

await connectToDatabase();
await connectToRedis();
await connectToDenoKV();

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
