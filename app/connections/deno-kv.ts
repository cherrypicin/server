export const connectToDenoKV = async () => {
	let kv;

	if (kv) {
		console.log("Already connected to Deno KV");
		return kv;
	}

	try {
		kv = await Deno.openKv(
			"https://api.deno.com/databases/7fce3ef5-79d6-4e46-a482-d437cae179e7/connect"
		);

		console.log("Connected to Deno KV");
	} catch (error) {
		console.error(error);
	}
	return kv;
};
