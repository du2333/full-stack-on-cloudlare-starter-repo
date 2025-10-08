import { aiDestinationChecker } from '@/helpers/ai-destination-checker';
import { collectDestinationInfo } from '@/helpers/browser-render';
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { addEvaluation } from '@repo/data-ops/queries/evaluation';
import { initDatabase } from '@repo/data-ops/database';

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<Env, DestinationEvaluationParams> {
	async run(event: Readonly<WorkflowEvent<DestinationEvaluationParams>>, step: WorkflowStep) {
		initDatabase(this.env.DB);

		const collectedData = await step.do('Collect rendered destination page data', async () => {
			return await collectDestinationInfo(this.env, event.payload.destinationUrl);
		});

		const aiStatus = await step.do(
			'Use AI to check the status of the page',
			{
				retries: {
					limit: 0,
					delay: 0,
				},
			},
			async () => {
				return await aiDestinationChecker(this.env, collectedData.bodyText);
			}
		);

		const evaluationId = await step.do('Save evaluation to database', async () => {
			return await addEvaluation({
				linkId: event.payload.linkId,
				accountId: event.payload.accountId,
				destinationUrl: event.payload.destinationUrl,
				status: aiStatus.status,
				reason: aiStatus.statusReason,
			});
		});

		console.log(collectedData, aiStatus);
	}
}
