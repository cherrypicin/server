import { oakCors } from "oak-cors";

export const corsMiddleware = oakCors({
	origin: ["http://localhost:3000", "http://localhost:3001"],
	credentials: true,
	optionsSuccessStatus: 200,
});
