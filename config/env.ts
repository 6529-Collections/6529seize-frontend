import { publicEnvSchema, type PublicEnv } from "./env.schema";

const raw =
  typeof process !== "undefined" ? process.env.PUBLIC_RUNTIME : undefined;
const parsed = publicEnvSchema.parse(raw ? JSON.parse(raw) : {});

export const publicEnv: PublicEnv = parsed;
