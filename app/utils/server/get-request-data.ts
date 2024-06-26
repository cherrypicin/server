import { RouteParams, RouterContext, Request } from "oak";

export interface RequestData {
	appSource: string;
	body: any;
	contentType: string | null;
	cookies: { [key: string]: string };
	ip: string;
	method: string;
	pathname: string;
	request: Request;
	search: string;
	searchParams?: { [key: string]: string };
	session?: string;
	userAgent?: string;
	userId: string;
}

const parseCookies = (header: string | null) => {
	const cookies: { [key: string]: string } = {};
	if (header) {
		const items = header.split(";");
		items.forEach((item) => {
			const [key, value] = item.split("=").map((part) => part.trim());
			if (key && value) {
				cookies[key] = value;
			}
		});
	}
	return cookies;
};

const getSession = (params: { cookies: { [key: string]: string } }) => {
	const { cookies } = params;
	const session = cookies.session;
	if (session) {
		return session;
	}
};

const getRequestData = async <T extends string>(
	context: RouterContext<T, RouteParams<T>>
): Promise<RequestData> => {
	const { request } = context;

	const { headers, method, url } = request;
	const { pathname, search } = url;

	const appSource = headers.get("x-app-source");
	const contentType = headers.get("content-type");
	const authorization = headers.get("authorization");
	const userAgent = headers.get("user-agent");
	const cookies = parseCookies(headers.get("Cookie"));

	const searchParams = new URLSearchParams(search);

	const session = getSession({ cookies });

	const ip = request.ip;

	let body = null;
	if (request.hasBody) {
		body = await request.body.json();
		console.log("request body ", body);
	}

	const searchParamsObject = {};
	for (const [key, value] of searchParams) {
		//@ts-ignore
		searchParamsObject[key] = value;
	}

	const requestData = {
		appSource,
		authorization,
		body,
		contentType,
		cookies,
		ip,
		// headers,
		method,
		pathname,
		request,
		search,
		searchParams: searchParamsObject,
		session,
		userAgent,
		userId: "",
	};

	return Object.freeze(requestData) as RequestData;
};

export { getRequestData };
