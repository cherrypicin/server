import { cyan, magenta, yellow } from "colors";

export const stepLogger = ({ step, params }: { step: string; params: any }) => {
	console.log(yellow("STEP:"));
	console.log(
		"--------------------------------------------------------------------------------------------------"
	);
	console.log(` ${magenta(step)} - ${cyan(JSON.stringify(params))}`);
	console.log(
		"--------------------------------------------------------------------------------------------------"
	);
};
