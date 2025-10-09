import { App } from '@/hono/app';
import { handleLinkClick } from '@/queue-handlers/link-clicks';
import { initDatabase } from '@repo/data-ops/database';
import { QueueMessageSchema } from '@repo/data-ops/zod-schema/queue';
import { WorkerEntrypoint } from 'cloudflare:workers';
export { DestinationEvaluationWorkflow } from '@/workflows/destination_evaluation_workflow';
export { EvaluationScheduler } from '@/durable-objects/evaluation-scheduler';
export { LinkClickTracker } from '@/durable-objects/link-click-tracker';

export default class DataService extends WorkerEntrypoint<Env> {
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		initDatabase(env.DB);
	}
	fetch(request: Request) {
		return App.fetch(request, this.env, this.ctx);
	}
	async queue(batch: MessageBatch<unknown>): Promise<void> {
		for (const message of batch.messages) {
			const parsedEvent = QueueMessageSchema.safeParse(message.body);
			if (parsedEvent.success) {
				const event = parsedEvent.data;
				switch (event.type) {
					case 'LINK_CLICK':
						await handleLinkClick(this.env, event);
						break;
					default:
						console.error(`Unknown event type: ${event.type}`);
						break;
				}
			} else {
				console.error(parsedEvent.error);
			}
		}
	}
}
