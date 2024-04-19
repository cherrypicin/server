export const generateVerificationToken = () => {
	try {
		const byteArray = new Uint8Array(10);
		crypto.getRandomValues(byteArray);

		let code = Array.from(byteArray, (byte) => byte.toString(36)).join("");

		while (code.length < 10) {
			let extraByte = new Uint8Array(1);
			crypto.getRandomValues(extraByte);
			code += extraByte[0].toString(36);
		}

		code = code.slice(0, 5) + "-" + code.slice(8, 13);

		return code;
	} catch (error) {
		console.error(error);
	}
};
