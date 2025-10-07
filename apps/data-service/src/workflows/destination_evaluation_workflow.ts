import { aiDestinationChecker } from '@/helpers/ai-destination-checker';
import { collectDestinationInfo } from '@/helpers/browser-render';
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<Env, DestinationEvaluationParams> {
	async run(event: Readonly<WorkflowEvent<DestinationEvaluationParams>>, step: WorkflowStep) {
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

		console.log(collectedData, aiStatus);
	}
}
