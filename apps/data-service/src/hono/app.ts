import { getDestinationFromLinkInfo, getRoutingDestination } from '@/helpers/route-ops';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import { Hono } from 'hono';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', async (c) => {
	const id = c.req.param('id');

	const linkInfo = await getRoutingDestination(c.env, id);
	if (!linkInfo) {
		return c.json({ error: 'Link not found' }, 404);
	}

	const cfHeaders = cloudflareInfoSchema.safeParse(c.req.raw.cf);
	if (!cfHeaders.success) {
		return c.json({ error: 'Invalid Cloudflare headers' }, 400);
	}

	const headers = cfHeaders.data;
	const destination = getDestinationFromLinkInfo(linkInfo, headers.country);

	const queueMessage: LinkClickMessageType = {
		type: 'LINK_CLICK',
		data: {
			id,
			country: headers.country,
			destination,
			accountId: linkInfo.accountId,
			latitude: headers.latitude,
			longitude: headers.longitude,
			timestamp: new Date().toISOString(),
		},
	};
	// this ensures the redirect happens immediately and the message is sent in the background
	c.executionCtx.waitUntil(c.env.QUEUE.send(queueMessage));
	return c.redirect(destination);
});

