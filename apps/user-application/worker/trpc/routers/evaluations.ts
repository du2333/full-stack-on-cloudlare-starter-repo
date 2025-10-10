import { t } from "@/worker/trpc/trpc-instance";

import {
  getNotAvailableEvaluations,
  getEvaluations,
} from "@repo/data-ops/queries/evaluation";
import { z } from "zod";

export const evaluationsTrpcRoutes = t.router({
  problematicDestinations: t.procedure.query(async ({ ctx }) => {
    return await getNotAvailableEvaluations(ctx.userInfo.userId);
  }),
  recentEvaluations: t.procedure
    .input(
      z
        .object({
          createdBefore: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx: _, input }) => {
      const evaluations = await getEvaluations(
        "testaccountid",
        input?.createdBefore
      );

      const oldestCreatedAt =
        evaluations.length > 0
          ? evaluations[evaluations.length - 1].createdAt
          : null;

      return {
        data: evaluations,
        oldestCreatedAt,
      };
    }),
});
