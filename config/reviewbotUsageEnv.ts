import { z } from "zod";

const reviewbotUsageEnvSchema = z.object({
  REVIEWBOT_USAGE_API_BASE_URL: z.string().optional(),
  REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH: z.string().optional(),
});

export type ReviewbotUsageEnv = z.infer<typeof reviewbotUsageEnvSchema>;

export function getReviewbotUsageEnv(
  env: NodeJS.ProcessEnv = process.env
): ReviewbotUsageEnv {
  const parsed = reviewbotUsageEnvSchema.safeParse({
    REVIEWBOT_USAGE_API_BASE_URL: env["REVIEWBOT_USAGE_API_BASE_URL"],
    REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH:
      env["REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH"],
  });

  if (!parsed.success) {
    return {};
  }

  return parsed.data;
}
