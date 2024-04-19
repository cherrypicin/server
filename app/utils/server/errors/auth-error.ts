export class AuthError extends Error {
	authErrors: any;

	constructor(message: string, authErrors: any) {
		super(message);
		this.authErrors = authErrors;
		Object.setPrototypeOf(this, AuthError.prototype);
	}
}
