import * as djwt from "djwt";
import { load } from "dotenv";
import CryptoJS from "npm:crypto-js@4.2.0";
import { Type } from "typebox";
import { HandlerFunctionParams } from "./types.ts";
import {
	generateVerificationToken,
	handleDBOperation,
	handleRedisDBOperation,
	stepLogger,
	validateBody,
} from "@utils";

import { handleCacheOperation } from "../utils/cache/index.ts";

const env = await load();

function encrypt({ text, key }: { text: string; key: string }) {
	return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt({ ciphertext, key }: { ciphertext: string; key: string }) {
	const bytes = CryptoJS.AES.decrypt(ciphertext, key);
	console.log("bytes", bytes);
	return bytes.toString(CryptoJS.enc.Utf8);
}

const loginBodySchema = Type.Object({
	email: Type.String({ format: "email" }),
	clientAuthCode: Type.String(),
});

const verifyEmailBasedLoginBodySchema = Type.Object({
	email: Type.String({ format: "email" }),
	token: Type.String(),
});

async function generateCryptoKey(secret: string): Promise<CryptoKey> {
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

const generateJWT = async (params: any) => {
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

const generateSession = async (params: any) => {
	stepLogger({
		step: "generateSession",
		params,
	});
	const { data } = params;
	const { email, userId, token, deviceDetails } = data;

	const sessionId = crypto.randomUUID();
	const session = {
		_id: sessionId,
		userId,
		email,
		token,
		deviceDetails,
	};
	const sessionKey = `${sessionId}`;

	//@ts-ignore
	await handleRedisDBOperation({
		operation: "create",
		collection: "session",
		data: session,
		ttl: 60 * 60 * 24 * 30 * 12,
	});

	const encryptedSessionKey = encrypt({
		text: sessionKey,
		key: env["AUTH_SESSION_ENCRYPTION_KEY"],
	});
	return encryptedSessionKey;
};

const checkIfUserExists = async (params: any) => {
	const { data } = params;
	const { email } = data;

	//@ts-ignore
	const user = await handleDBOperation({
		operation: "get-data-by-filter",
		filter: { email },
		collection: "users",
	});

	if (user.length === 0) {
		console.log("sign up flow from here");
		return false;
	} else {
		console.log("create session flow from here");
		const userInDB = user[0];
		return { userInDB };
	}
};

const intiateEmailBasedLogin = async (params: any) => {
	const { data } = params;

	const valid = await validateBody({
		data,
		schema: loginBodySchema,
	});

	const verificationToken = generateVerificationToken();

	//@ts-ignore
	const setInCache = await handleCacheOperation({
		operation: "set",
		key: `${verificationToken}-${data.email}`,
		data,
		ttl: 60,
	});

	console.log("setInCache", setInCache);

	return verificationToken;
};

const verifyUserAndHandleSession = async (params: any) => {
	console.log("verifyUserAndHandleSession", params);
	const { email } = params;

	//@ts-ignore
	const result = await checkIfUserExists({
		data: { email },
	});

	let jwt = null;
	let userId = null;
	if (!result) {
		console.log("user does not exist");

		userId = crypto.randomUUID();

		await handleDBOperation({
			operation: "create",
			collection: "users",
			data: { email, _id: userId },
		});
	} else {
		const { userInDB } = result;
		userId = userInDB._id;
	}
	jwt = await generateJWT({
		data: {
			email,
			userId,
		},
	});
	const session = await generateSession({
		data: {
			email,
			userId,
			token: jwt,
			deviceDetails: "deviceDetails",
		},
	});
	return session;
};

const verifyEmailBasedLogin = async (params: any) => {
	const { data } = params;

	const valid = await validateBody({
		data,
		schema: verifyEmailBasedLoginBodySchema,
	});

	const { email, token } = data;
	const emailAuthKey = `${token}-${email}`;

	//@ts-ignore
	const storedData = await handleCacheOperation({
		operation: "get",
		key: emailAuthKey,
	});

	if (!storedData) {
		throw new Error("Invalid token");
	}

	const _storedData = JSON.parse(storedData);

	const session = await verifyUserAndHandleSession({
		email: _storedData.email,
	});

	return session;
};

const loginHandlers = {
	initiateEmailBasedLogin: intiateEmailBasedLogin,
	verifyEmailBasedLogin: verifyEmailBasedLogin,
};

export const handleLogin = async (params: HandlerFunctionParams) => {
	const { context } = params;

	const { body } = params.requestData;
	const { data, operation } = body;

	try {
		//@ts-ignore
		const result = await loginHandlers[operation]({
			data,
		});

		context.response.body = {
			result,
		};

		context.response.status = 200;
	} catch (error) {
		context.response.body = {
			error: error.message,
			stack: error.stack,
		};
		context.response.status = 500;
	}
};
