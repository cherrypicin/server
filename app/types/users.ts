import { Static, Type } from "typebox";

const AuthProvider = Type.Object({
	name: Type.Union([Type.Literal("google"), Type.Literal("apple")]),
	id: Type.String(),
	label: Type.String(),
});

const Device = Type.Object({
	current: Type.Boolean(),
	id: Type.String(),
	deviceDetails: Type.String(),
	lastLoggedIn: Type.String({ format: "date-time" }),
});

const Backup = Type.Object({
	time: Type.String({ format: "date-time" }),
	_id: Type.String(), // S3 id for backup file
	url: Type.String(),
});

const Invoice = Type.Object({
	title: Type.String(),
	url: Type.String(),
	amount: Type.Number(),
	tax: Type.Number(),
});

const Billing = Type.Object({
	invoices: Type.Array(Invoice),
	lastPayment: Type.Object({
		date: Type.String({ format: "date-time" }),
		mode: Type.String(),
	}),
});

const Storage = Type.Object({
	media: Type.Number(), // Assuming bytes/number format for storage size
	bookmarks: Type.Number(),
	tags: Type.Number(),
});

export const UserProfile = Type.Object({
	_id: Type.Optional(Type.String()),
	active: Type.Optional(Type.Boolean()),
	authProviders: Type.Array(AuthProvider),
	avatar: Type.Optional(Type.String()),
	backups: Type.Array(Backup),
	bannerImage: Type.Optional(Type.String()),
	billing: Billing,
	changeFlag: Type.Optional(Type.Boolean()),
	createdAt: Type.String({ format: "date-time" }),
	devices: Type.Array(Device),
	emailId: Type.Optional(Type.String()),
	name: Type.Optional(Type.String()),
	storage: Storage,
	syncId: Type.Optional(Type.String()),
	twoFA: Type.Optional(Type.Boolean()),
	userId: Type.String(),
	userName: Type.Optional(Type.String()),
});
