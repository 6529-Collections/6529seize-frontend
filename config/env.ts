import { publicEnvSchema, type PublicEnv } from "./env.schema";

const raw =
  typeof process === "undefined" ? undefined : process.env["PUBLIC_RUNTIME"];
const parsed = publicEnvSchema.parse(raw ? JSON.parse(raw) : {});

export const publicEnv: PublicEnv = parsed;

export const getNodeEnv = (): string | undefined => {
  if (publicEnv.NODE_ENV) {
    return publicEnv.NODE_ENV;
  }
  if (typeof process === "undefined") {
    return undefined;
  }
  return process.env.NODE_ENV;
};
