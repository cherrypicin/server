import { RouteParams, RouterContext, Request } from "oak";

export interface HttpRequestData {
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
	userAgent?: string;
	userId?: string;
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

const getRequestData = <T extends string>(
	context: RouterContext<T, RouteParams<T>>
): HttpRequestData => {
	const { request } = context;

	const { headers, method, url } = request;
	const { pathname, search } = url;

	const contentType = headers.get("content-type");
	const appSource = headers.get("x-app-source");
	const authorization = headers.get("authorization");
	const userAgent = headers.get("user-agent");
	const searchParams = new URLSearchParams(search);
	const ip = request.ip;
	const body = request.body;
	const cookies = parseCookies(headers.get("Cookie"));

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
		userAgent,
	};

	return Object.freeze(requestData) as HttpRequestData;
};

export { getRequestData };
