import { Router } from "oak";
import { endPointHandler } from "../factory/index.ts";
import { Route } from "./routes.ts";

function registerRoutes({
	routes,
	router,
}: {
	routes: Route[];
	router: Router;
}) {
	routes.forEach((route) => {
		const { method, path, action } = route;

		switch (method) {
			case "GET":
				router.get(path, endPointHandler(action));
				break;
			case "POST":
				router.post(path, endPointHandler(action));
				break;
			case "PATCH":
				router.patch(path, endPointHandler(action));
				break;
			case "DELETE":
				router.delete(path, endPointHandler(action));
				break;
			default:
				console.error(`Invalid method "${method}" for route "${path}".`);
		}
	});
}

export { registerRoutes };
