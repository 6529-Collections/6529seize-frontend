import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { v4 as uuidv4 } from "uuid";
import type { z as zod } from "zod";

const BINDING_KEY = "push-device-binding-v1";
const createBindingSchema = (z: typeof zod) =>
  z.object({
    nativeId: z.string().min(1),
    deviceId: z.string().min(1).max(100),
    previousDeviceId: z.string().min(1).max(100).optional(),
  });
type PushDeviceIdentity = zod.infer<ReturnType<typeof createBindingSchema>>;
let inFlightIdentity: Promise<PushDeviceIdentity> | undefined;

// The notifications provider imports this module on every page, so zod
// loads with the first native identity read instead of with the page.
async function loadBindingSchema() {
  const { z } = await import("zod");
  return createBindingSchema(z);
}

async function readOptional(key: string): Promise<string | undefined> {
  try {
    return (await SecureStoragePlugin.get({ key })).value;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/item with given key does not exist|not found/i.test(message)) return;
    // An unavailable keychain must never silently rotate the installation.
    throw error;
  }
}

async function resolveIdentity(): Promise<PushDeviceIdentity> {
  const { Device } = await import("@capacitor/device");
  const { identifier } = await Device.getId();
  if (!identifier.trim()) throw new Error("Native device identity unavailable");
  const bindingSchema = await loadBindingSchema();
  const stored = await readOptional(BINDING_KEY);
  const binding = stored ? bindingSchema.parse(JSON.parse(stored)) : undefined;
  if (binding?.nativeId === identifier) return binding;
  // Native vendor/app device IDs distinguish a restored backup on another
  // phone. Never use the copied legacy UUID as the new delivery namespace.
  const previousDeviceId =
    binding?.deviceId ?? (await readOptional("stable_device_id"));
  const identity: PushDeviceIdentity = {
    nativeId: identifier,
    deviceId: uuidv4(),
    ...(previousDeviceId ? { previousDeviceId } : {}),
  };
  await SecureStoragePlugin.set({
    key: BINDING_KEY,
    value: JSON.stringify(identity),
  });
  return identity;
}

export function getPushDeviceIdentity(): Promise<PushDeviceIdentity> {
  inFlightIdentity ??= resolveIdentity().finally(() => {
    inFlightIdentity = undefined;
  });
  return inFlightIdentity;
}

export async function getStableDeviceId(): Promise<string> {
  return (await getPushDeviceIdentity()).deviceId;
}
