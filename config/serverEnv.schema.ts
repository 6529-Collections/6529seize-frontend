import { z } from "zod";

export const serverEnvSchema = z.object({
  SSR_CLIENT_ID: z.string().min(1, "SSR_CLIENT_ID is required"),
  SSR_CLIENT_SECRET: z.string().min(1, "SSR_CLIENT_SECRET is required"),
  GITHUB_LINK_STATUS_PREVIEW_TOKEN: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
