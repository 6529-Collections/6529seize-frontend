import { serverEnvSchema, type ServerEnv } from "./serverEnv.schema";

if (globalThis.window !== undefined) {
  throw new TypeError("serverEnv can only be accessed on the server side");
}

const getServerEnv = (): ServerEnv | null => {
  if (typeof process === "undefined" || !process.env) {
    return null;
  }

  const raw = {
    SSR_CLIENT_ID: process.env.SSR_CLIENT_ID,
    SSR_CLIENT_SECRET: process.env.SSR_CLIENT_SECRET,
  };

  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const getServerEnvOrThrow = (): ServerEnv => {
  const env = getServerEnv();
  if (!env) {
    throw new Error(
      "SSR_CLIENT_ID and SSR_CLIENT_SECRET must be set as runtime environment variables"
    );
  }
  return env;
};

export const serverEnv: ServerEnv | null = getServerEnv();
