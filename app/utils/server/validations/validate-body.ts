import Ajv from "npm:ajv";
import addFormats from "npm:ajv-formats";

import { ValidationError } from "../errors/validation-errors.ts";
import { stepLogger } from "../logging/step-logger.ts";

function convertToDatesUsingSchema(params: { data: any; schema: any }) {
	const { data, schema } = params;

	stepLogger({ step: "convertToDatesUsingSchema", params });
	const schemaProperties = schema.properties;

	Object.keys(schemaProperties).forEach((key) => {
		if (schemaProperties[key].format === "date-time" && data[key] != null) {
			data[key] = new Date(data[key]);
		}
	});

	return data;
}

export const validateBody = async (params: { data: any; schema: any }) => {
	const { data, schema } = params;

	stepLogger({ step: "validateBody", params });
	//@ts-ignore
	const ajv = new Ajv({
		allErrors: true,
		// verbose: true,
	});
	//@ts-ignore
	addFormats(ajv);

	const validate = ajv.compile(schema);
	const valid = validate(data);
	if (!valid) {
		throw new ValidationError("Validation error", validate.errors);
	}

	convertToDatesUsingSchema({ data, schema });

	return true;
};
