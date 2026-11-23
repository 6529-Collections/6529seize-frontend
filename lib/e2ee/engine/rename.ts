import { checkpoint, type EngineContext } from "./context";
import { E2eeError } from "./errors";

/**
 * Renames one of this profile's encrypted-DM devices, this one included. A
 * superseded tab must stop before changing a device name, so the rename runs
 * on the engine queue after a checkpoint. The caller refreshes the device list.
 */
export async function renameEngineDevice(
  ctx: EngineContext,
  deviceKey: string,
  label: string
): Promise<void> {
  if (!ctx.device) {
    throw new E2eeError("E2EE_NOT_READY");
  }
  const target = deviceKey.toLowerCase();
  // Read through a function: the flag can change while the checkpoint awaits.
  const isDisposed = () => ctx.disposed;
  await ctx.queue.run(async () => {
    if (ctx.disposed) throw new E2eeError("E2EE_NOT_READY");
    await checkpoint(ctx, { skipWasm: true });
    if (isDisposed()) throw new E2eeError("E2EE_NOT_READY");
    await ctx.api.renameDevice(target, label);
  });
}
