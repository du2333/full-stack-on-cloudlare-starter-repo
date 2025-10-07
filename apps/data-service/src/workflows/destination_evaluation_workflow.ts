import { collectDestinationInfo } from '@/helpers/browser-render';
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<Env, DestinationEvaluationParams> {
	async run(event: Readonly<WorkflowEvent<DestinationEvaluationParams>>, step: WorkflowStep) {
		const collectedData = await step.do('Collect rendered destination page data', async () => {
			return collectDestinationInfo(this.env, event.payload.destinationUrl);
		});

		console.log(collectedData);
	}
}
