import { z } from "zod";

export const serverEnvSchema = z.object({
  SSR_CLIENT_ID: z.string().min(1, "SSR_CLIENT_ID is required"),
  SSR_CLIENT_SECRET: z.string().min(1, "SSR_CLIENT_SECRET is required"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
