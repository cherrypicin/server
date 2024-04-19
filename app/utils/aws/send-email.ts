import AWS from "npm:aws-sdk@2.1526.0";
import { load } from "dotenv";

const env = await load();

AWS.config.update({
	accessKeyId: env["AWS_ACCESS_KEY"],
	secretAccessKey: env["AWS_SECRET_ACCESS_KEY"],
	region: "us-east-1",
});

const ses = new AWS.SES();

export const sendEmail = async ({
	email,
	subject,
	message,
}: {
	email: string;
	subject: string;
	message: string;
}) => {
	const emailParams = {
		Source: "bennyeleventytwo@gmail.com",
		Destination: {
			ToAddresses: [email],
		},
		Message: {
			Subject: {
				Data: subject,
			},
			Body: {
				Text: {
					Data: message,
				},
			},
		},
	};

	try {
		await ses.sendEmail(emailParams).promise();
	} catch (error) {
		console.error("Error sending email", error);
	}
};
