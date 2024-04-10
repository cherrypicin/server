import { stepLogger } from "@utils";
import { modelMapping } from "./model-mapping.ts";

export const getModelMapping = ({
	collection,
	operation,
}: {
	collection: any;
	operation: any;
}) => {
	stepLogger({
		step: "getModelMapping",
		params: { collection, operation },
	});
	// @ts-ignore
	const model = modelMapping[collection];
	if (!model) {
		return null;
	}
	return {
		schema: model[operation].schema,
		hooks: model[operation].hooks,
	};
};
