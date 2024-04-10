export class SyncDBError extends Error {
	validationErrors: any;

	constructor(message: string, errros: any) {
		super(message);
		Object.setPrototypeOf(this, SyncDBError.prototype);
	}
}
