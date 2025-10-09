import { getLink } from '@repo/data-ops/queries/links';
import { linkSchema, LinkSchemaType } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';

async function getLinkInfoFromKv(env: Env, id: string) {
	const linkInfo = await env.CACHE.get(id);
	if (!linkInfo) {
		return null;
	}
	try {
		const parsedLinkInfo = JSON.parse(linkInfo);
		return linkSchema.parse(parsedLinkInfo);
	} catch (error) {
		return null;
	}
}

const TTL_TIME = 60 * 60 * 24; // 24 hours

async function saveLinkInfoToKv(env: Env, id: string, linkInfo: LinkSchemaType) {
	try {
		await env.CACHE.put(id, JSON.stringify(linkInfo), {
			expirationTtl: TTL_TIME,
		});
	} catch (error) {
		console.error('Error saving link info to kv', error);
	}
}

export async function getRoutingDestination(env: Env, id: string) {
	const linkInfo = await getLinkInfoFromKv(env, id);
	if (linkInfo) return linkInfo;
	const linkInfoFromDb = await getLink(id);
	if (!linkInfoFromDb) return null;
	await saveLinkInfoToKv(env, id, linkInfoFromDb);
	return linkInfoFromDb;
}

export function getDestinationFromLinkInfo(linkInfo: LinkSchemaType, countryCode?: string) {
	if (!countryCode) {
		return linkInfo.destinations.default;
	}

	if (linkInfo.destinations[countryCode]) {
		return linkInfo.destinations[countryCode];
	}

	return linkInfo.destinations.default;
}

export async function scheduleEvalWorkflow(env: Env, event: LinkClickMessageType) {
	const doId = env.EVALUATION_SCHEDULER.idFromName(`${event.data.id}:${event.data.destination}`);
	const stub = env.EVALUATION_SCHEDULER.get(doId);
	await stub.collectLinkClick(event.data.accountId, event.data.id, event.data.destination, event.data.country || 'UNKNOWN');
}
