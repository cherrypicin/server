import { syncDBRepository } from "../connections/sync-db.ts";
import { HandlerFunctionParams } from "./types.ts";

export const handleDeltaSync = async ({
	requestData,
	context,
}: HandlerFunctionParams) => {
	const { body } = requestData;
	const { fromSyncId, toSyncId } = body;
	//@ts-ignore
	async function queryBySyncIdRange({
		repository,
		fromSyncId,
		toSyncId,
	}: {
		repository: any;
		fromSyncId: number;
		toSyncId: number;
	}) {
		const entities = await syncDBRepository
			.search()
			.where("userId")
			.eq(12347)
			.where("syncId")
			.between(fromSyncId, toSyncId)
			.sortBy("updatedAt", "ASC")
			.return.all();
		return entities;
	}
	const entities = await queryBySyncIdRange({
		repository: syncDBRepository,
		fromSyncId,
		toSyncId,
	});

	//@ts-ignore
	const updatedData = entities.map((entity) => {
		return {
			...entity,
			//@ts-ignore
			data: JSON.parse(entity.data),
		};
	});
	//@ts-ignore
	context.response.headers.set("Content-Type", "application/json");
	context.response.status = 200;
	context.response.body = {
		data: updatedData,
	};
};
