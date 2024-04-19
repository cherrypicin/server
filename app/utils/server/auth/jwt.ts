import * as djwt from "djwt";
import { load } from "dotenv";

import { stepLogger } from "@utils";

const env = await load();

export async function generateCryptoKey(secret: string): Promise<CryptoKey> {
	const keyData = new TextEncoder().encode(secret);
	const key = await crypto.subtle.importKey(
		"raw", // format
		keyData, // keyData
		{ name: "HMAC", hash: { name: "SHA-256" } }, // algorithm details
		false, // not extractable
		["sign", "verify"] // usages
	);
	return key;
}

export const generateJWT = async (params: any) => {
	stepLogger({
		step: "generateJWT",
		params,
	});

	const { data } = params;
	const { email, userId } = data;
	const payload = {
		email,
		userId,
	};
	const key = env["AUTH_JWT_SECRET"];
	const cryptoKey = await generateCryptoKey(key);
	const jwt = djwt.create({ alg: "HS256", typ: "JWT" }, payload, cryptoKey);

	return jwt;
};

export const verifyJWT = async (params: any) => {
	const { data } = params;
	const { token } = data;

	const key = env["AUTH_JWT_SECRET"];
	const cryptoKey = await generateCryptoKey(key);

	const decoded = djwt.verify(token, cryptoKey);

	if (!decoded) {
		throw new Error("Invalid token");
	}
	return decoded;
};
