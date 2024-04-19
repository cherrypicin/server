export interface Route {
	method: "GET" | "POST" | "PATCH" | "DELETE";
	path: string;
	action: string;
	group?: string;
}

export const routes: Route[] = [
	{ method: "POST", path: "/get", action: "get" },
	{ method: "POST", path: "/search", action: "search" },
	{ method: "POST", path: "/mutate", action: "mutate" },
	{
		method: "POST",
		path: "/full-bootstrap",
		action: "full-bootstrap",
		group: "sync",
	},
	{ method: "POST", path: "/delta-sync", action: "delta-sync", group: "sync" },
	{ method: "POST", path: "/media-management", action: "media-management" },
	{
		method: "POST",
		path: "/session-management",
		action: "session-management",
		group: "auth",
	},
	{ method: "POST", path: "/login", action: "login", group: "auth" },
	{ method: "GET", path: "/callback", action: "callback", group: "auth" },
	{ method: "GET", path: "/logout", action: "logout", group: "auth" },
	{
		method: "GET",
		path: "/oauth/authorize",
		action: "authorization",
		group: "auth",
	},
	{
		method: "GET",
		path: "/oauth/token",
		action: "access-token",
		group: "auth",
	},
	{ method: "GET", path: "/token", action: "token", group: "auth" },
];
