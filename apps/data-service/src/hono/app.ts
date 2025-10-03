import { getLink } from '@repo/data-ops/queries/links';
import { Hono } from 'hono';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { getDestinationFromLinkInfo } from '@/helpers/route-ops';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', async (c) => {
	const id = c.req.param('id');

	const linkInfo = await getLink(id);
	if (!linkInfo) {
		return c.json({ error: 'Link not found' }, 404);
	}

	const cfHeaders = cloudflareInfoSchema.safeParse(c.req.raw.cf);
	if (!cfHeaders.success) {
		return c.json({ error: 'Invalid Cloudflare headers' }, 400);
	}

	const headers = cfHeaders.data;
	const destination = getDestinationFromLinkInfo(linkInfo, headers.country);

	return c.redirect(destination);
});
