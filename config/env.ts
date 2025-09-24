import { publicEnvSchema, type PublicEnv } from "./env.schema";

const raw =
  typeof process === "undefined" ? undefined : process.env.PUBLIC_RUNTIME;
const parsed = publicEnvSchema.parse(raw ? JSON.parse(raw) : {});

export const publicEnv: PublicEnv = parsed;
