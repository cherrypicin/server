import CryptoJS from "npm:crypto-js@4.2.0";

export function encrypt({ text, key }: { text: string; key: string }) {
	return CryptoJS.AES.encrypt(text, key).toString();
}

export function decrypt({
	ciphertext,
	key,
}: {
	ciphertext: string;
	key: string;
}) {
	const bytes = CryptoJS.AES.decrypt(ciphertext, key);
	return bytes.toString(CryptoJS.enc.Utf8);
}
