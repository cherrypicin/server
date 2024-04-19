export class ValidationError extends Error {
	validationErrors: any;

	constructor(message: string, validationErrors: any) {
		super(message);
		this.validationErrors = validationErrors;
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}
