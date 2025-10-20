import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createBetterAuth } from "@/auth";

export const auth: ReturnType<typeof createBetterAuth> = createBetterAuth(
  drizzleAdapter(
    {},
    {
      provider: "sqlite",
    }
  ),
  ""
);
