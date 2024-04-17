export const connectToDenoKV = async () => {
	let kv;

	if (kv) {
		console.log("Already connected to Deno KV");
		return kv;
	}

	try {
		kv = await Deno.openKv();

		console.log("Connected to Deno KV");
	} catch (error) {
		console.error(error);
	}
	return kv;
};
