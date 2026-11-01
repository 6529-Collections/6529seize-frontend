import { downloadMedia, localBlobType } from "../media";
import { getDefaultBackupStateStore } from "../backup/state";
import type { BackupHistory } from "../backup/format";
import type {
  E2eeEngineExt,
  E2eeEngineOptions,
  E2eeEngineStatus,
  E2eeImported,
  E2eeMessage,
  E2eeReportPreview,
} from "../types";
import {
  checkpoint,
  clearStoredState,
  requireGroup,
  requireMls,
  type EngineContext,
} from "./context";
import { EngineController } from "./controller";
import {
  enrollDevice,
  hasLoginGrant,
  grantExpired,
  refreshMe,
  renewalDue,
  renewGrant,
  submitRevocation,
} from "./enroll";
import { backupHistory, importBackupHistory } from "./backup";
import { E2eeError, errorMessage } from "./errors";
import {
  addMembers,
  checkEligibility,
  createConversation,
  findDm,
  leave,
  removeMember,
  rename,
  restartTargets,
  setAdmin,
} from "./membership";
import { searchMessages } from "./messages";
import { previewReport, sendReport } from "./report";
import { queueImported, queueMessage, queueTargeted } from "./send";
import {
  createContext,
  loadGroups,
  memberProfileIds,
  resolveProfiles,
  restore,
  setStatus,
  supported,
} from "./setup";
import { toE2eeMessage } from "./store";
import { approveDevice, ignoreUntrustedDevice } from "./trust";

/** Contract section 12 engine: framework-agnostic, one instance per profile. */

const OPEN_CONVERSATION_MS = 60_000;
const NEEDS_ENROLLMENT = "needs-enrollment" satisfies E2eeEngineStatus;

class E2eeEngineImpl implements E2eeEngineExt {
  private readonly ctx: EngineContext;
  private readonly controller: EngineController;

  constructor(ctx: EngineContext) {
    this.ctx = ctx;
    this.controller = new EngineController(ctx, {
      refreshMe: () => this.refreshMe(),
      onOwnRevoked: () => this.onOwnRejected(),
      afterSync: () => resolveProfiles(this.ctx, memberProfileIds(this.ctx)),
    });
  }

  async init(): Promise<void> {
    if (!supported(this.ctx.options)) {
      setStatus(this.ctx, "unsupported");
      return;
    }
    try {
      // Read the version before the state: if another tab writes in
      // between, this engine is the stale one and its first write is refused.
      this.ctx.stateVersion = await this.ctx.storage.getStateVersion(
        this.ctx.profileId
      );
      const restored = await restore(this.ctx);
      if (!restored) {
        setStatus(this.ctx, NEEDS_ENROLLMENT);
        await this.startEnrollmentFromLoginGrant();
        return;
      }
      setStatus(this.ctx, "ready");
      this.start();
    } catch (error) {
      setStatus(this.ctx, "error", errorMessage(error));
    }
  }

  /**
   * NC8: the sign-in signature already granted this browser's MLS key, so
   * enrollment needs no wallet prompt; finish it now. If the server refuses
   * the sign-in grant, drop that device: enroll() then falls back to the
   * separate grant prompt with a fresh key.
   */
  private async startEnrollmentFromLoginGrant(): Promise<void> {
    const stored = await this.ctx.storage.getDevice(this.ctx.profileId);
    if (!hasLoginGrant(stored) || stored.registered) {
      return;
    }
    // Runs in the background so engine start never waits on the network;
    // the status is "enrolling" from here until it settles.
    void this.ctx.tasks.track(this.enrollFromLoginGrant());
  }

  private async enrollFromLoginGrant(): Promise<void> {
    try {
      await this.runEnrollment(false);
    } catch {
      // A rejected sign-in grant was dropped: enroll() asks for the separate
      // grant signature. Any other failure leaves the pending device, and
      // enroll() retries it without a prompt.
      if (!this.ctx.disposed && this.ctx.store.status === "error") {
        setStatus(this.ctx, NEEDS_ENROLLMENT, this.ctx.store.error);
      }
    }
  }

  private start(): void {
    this.controller.startBackground();
    this.background(async () => {
      await this.refreshMe();
      await this.controller.syncAll();
    });
  }

  private background(task: () => Promise<void>): void {
    const run = async () => {
      try {
        await task();
      } catch (error) {
        if (!this.ctx.disposed) {
          this.ctx.store.error = errorMessage(error);
          this.ctx.store.touch();
        }
      }
    };
    void this.ctx.tasks.track(run());
  }

  /** GET /e2ee/me needs no registered device; failures keep the limit screen. */
  private async loadDevicesAtLimit(): Promise<void> {
    try {
      await refreshMe(this.ctx);
    } catch {
      // The device-limit screen still explains what to do without the list.
    }
  }

  private async refreshMe(): Promise<void> {
    if (!this.ctx.device?.registered || this.ctx.disposed) {
      return;
    }
    const result = await refreshMe(this.ctx);
    if (result.ownRevoked) {
      await this.wipe();
    }
  }

  /**
   * The server no longer accepts this device. An expired grant keeps the
   * state for a renewal through enroll(); a revocation wipes it.
   */
  private async onOwnRejected(): Promise<void> {
    const device = this.ctx.device;
    if (device && grantExpired(this.ctx, device)) {
      this.controller.stopBackground();
      setStatus(this.ctx, NEEDS_ENROLLMENT);
      return;
    }
    await this.wipe();
  }

  /**
   * This device was revoked: local state is useless; back to enrollment. The
   * encrypted-backup state for the profile goes too (its chunk key belongs
   * to this device). The background work stops but stays restartable: the
   * gate keeps this engine, and enroll() starts it again for a new device.
   */
  private async wipe(): Promise<void> {
    this.controller.stopBackground();
    await this.ctx.queue.run(async () => {
      this.ctx.timers.cancelAll();
      this.ctx.mls?.dispose();
      this.ctx.mls = null;
      this.ctx.device = null;
      this.ctx.lastState = null;
      this.ctx.store.groups.clear();
      this.ctx.store.thisDevice = null;
      await clearStoredState(this.ctx);
      try {
        await (
          this.ctx.options.backupState ?? getDefaultBackupStateStore()
        ).delete(this.ctx.profileId);
      } catch {
        // Best effort: a stale backup state is dropped on the next start
        // anyway (its device key no longer matches).
      }
      setStatus(this.ctx, NEEDS_ENROLLMENT);
    });
  }

  private onDelayed = (g: string): void => {
    this.ctx.timers.arm(`retry:${g}`, 5_000, () => {
      this.background(() => this.controller.syncGroup(g));
    });
  };

  private delayedFor(g: string): () => void {
    return () => {
      this.onDelayed(g);
    };
  }

  // -- state ------------------------------------------------------------------

  getStatus = () => this.ctx.store.status;
  getError = () => this.ctx.store.error;
  getThisDevice = () => this.ctx.store.thisDevice;
  getAttachmentsEnabled = () => this.ctx.store.attachmentsEnabled;
  getDevices = () => this.ctx.store.devices;
  getConversations = () => this.ctx.store.getConversations();
  getConversation = (g: string) =>
    this.ctx.store.getConversation(g.toLowerCase());
  getMessages = (g: string) => this.ctx.store.getMessages(g.toLowerCase());
  subscribe = (listener: () => void) => this.ctx.store.subscribe(listener);

  // -- lifecycle --------------------------------------------------------------

  async enroll(): Promise<void> {
    await this.runEnrollment(true);
  }

  private async runEnrollment(allowPrompt: boolean): Promise<void> {
    const status = this.ctx.store.status;
    if (status === "ready") {
      if (allowPrompt) {
        await this.renew();
      }
      return;
    }
    if (status === "enrolling" || status === "unsupported") {
      return;
    }
    setStatus(this.ctx, "enrolling");
    try {
      const ready = await this.ctx.queue.run(() =>
        enrollDevice(this.ctx, { allowPrompt })
      );
      if (!ready) {
        if (this.ctx.store.status === "enrolling") {
          // Nothing to enroll without a prompt (sign-in grant path).
          setStatus(this.ctx, NEEDS_ENROLLMENT);
          return;
        }
        // device-limit: list the profile's devices so the screen can show them.
        await this.loadDevicesAtLimit();
        return;
      }
      await loadGroups(this.ctx);
      setStatus(this.ctx, "ready");
      try {
        await this.refreshMe();
      } catch {
        // Retried by the background pass.
      }
      this.start();
    } catch (error) {
      const code = errorMessage(error);
      setStatus(
        this.ctx,
        code === "E2EE_SIGNATURE_REJECTED" ||
          code === "E2EE_LOGIN_GRANT_REJECTED"
          ? NEEDS_ENROLLMENT
          : "error",
        code
      );
      throw error;
    }
  }

  /** 8.8: in the grant's last 14 days, enroll() renews it (one prompt). */
  private async renew(): Promise<void> {
    const device = this.ctx.device;
    if (!device || !renewalDue(this.ctx, device)) {
      return;
    }
    await this.ctx.queue.run(() => renewGrant(this.ctx));
    for (const runtime of this.ctx.store.groups.values()) {
      runtime.record.selfUpdateRequested = true;
    }
    await this.refreshMe();
    for (const [g, runtime] of this.ctx.store.groups) {
      if (runtime.record.status === "active") {
        await this.controller.maintain(g);
      }
    }
  }

  async sync(): Promise<void> {
    if (this.ctx.store.status !== "ready") {
      return;
    }
    await this.controller.syncAll();
  }

  dispose(): void {
    this.ctx.disposed = true;
    this.controller.stopBackground();
    this.ctx.timers.dispose();
    void this.ctx.queue.drain().finally(() => {
      this.ctx.mls?.dispose();
      this.ctx.mls = null;
    });
  }

  setOpenConversation(g: string | null): void {
    const key = g?.toLowerCase() ?? null;
    const changed = key !== this.ctx.openConversation;
    this.ctx.openConversation = key;
    this.ctx.openUntil = key === null ? 0 : Number.MAX_SAFE_INTEGER;
    if (key !== null && changed && this.ctx.store.status === "ready") {
      // Contract 12: an open conversation polls every 5 s, starting now.
      this.controller.restartPolling();
      // 8.4 reconciliation on open: catch up, then look for missing devices.
      this.background(async () => {
        await this.controller.syncGroup(key);
        await this.controller.maintain(key);
      });
    }
  }

  async idle(): Promise<void> {
    for (let round = 0; round < 50; round += 1) {
      await this.ctx.tasks.drain();
      await this.ctx.queue.drain();
      if (this.ctx.tasks.size === 0 && this.ctx.queue.size === 0) {
        return;
      }
    }
  }

  // -- conversations ------------------------------------------------------------

  private requireReady(): void {
    if (this.ctx.store.status !== "ready" || !this.ctx.mls) {
      throw new E2eeError("E2EE_NOT_READY");
    }
  }

  checkEligibility = async (profileIds: string[]) => {
    this.requireReady();
    return checkEligibility(this.ctx, profileIds);
  };

  async createConversation(input: {
    profileIds: string[];
    kind: "dm" | "group";
    name?: string | null;
  }): Promise<string> {
    this.requireReady();
    const g = await createConversation(this.ctx, input, this.onDelayed);
    await resolveProfiles(this.ctx, input.profileIds);
    return g;
  }

  findDm = (profileId: string) => findDm(this.ctx, profileId);

  async send(
    g: string,
    input: {
      text: string;
      mentions?: string[];
      reply?: string | null;
      files?: File[];
    }
  ): Promise<void> {
    this.requireReady();
    if ((input.files?.length ?? 0) > 0 && !this.ctx.store.attachmentsEnabled) {
      throw new E2eeError("E2EE_ATTACHMENTS_DISABLED");
    }
    await queueMessage(this.ctx, g.toLowerCase(), input);
    await this.controller.flush(g.toLowerCase());
  }

  async sendImported(
    g: string,
    input: {
      text: string;
      imported: E2eeImported;
      reply?: string | null;
      files?: File[];
    }
  ): Promise<void> {
    this.requireReady();
    if ((input.files?.length ?? 0) > 0 && !this.ctx.store.attachmentsEnabled) {
      throw new E2eeError("E2EE_ATTACHMENTS_DISABLED");
    }
    if (await queueImported(this.ctx, g.toLowerCase(), input)) {
      await this.controller.flush(g.toLowerCase());
    }
  }

  private ownMessage(g: string, id: string) {
    const message = requireGroup(this.ctx, g).messages.get(id);
    if (message?.kind !== "message") {
      throw new E2eeError("E2EE_NO_MESSAGE");
    }
    return message;
  }

  async edit(g: string, id: string, text: string): Promise<void> {
    this.requireReady();
    const message = this.ownMessage(g, id);
    if (message.senderProfileId !== this.ctx.profileId || message.deleted) {
      throw new E2eeError("E2EE_NOT_SENDER");
    }
    await queueTargeted(this.ctx, g.toLowerCase(), (base) => ({
      ...base,
      t: "edit",
      target: id,
      text,
      mentions: message.mentions,
    }));
    await this.controller.flush(g.toLowerCase());
  }

  async remove(g: string, id: string): Promise<void> {
    this.requireReady();
    const message = this.ownMessage(g, id);
    if (message.senderProfileId !== this.ctx.profileId) {
      throw new E2eeError("E2EE_NOT_SENDER");
    }
    await queueTargeted(this.ctx, g.toLowerCase(), (base) => ({
      ...base,
      t: "del",
      target: id,
    }));
    await this.controller.flush(g.toLowerCase());
  }

  async react(
    g: string,
    id: string,
    reaction: string,
    on: boolean
  ): Promise<void> {
    this.requireReady();
    this.ownMessage(g, id);
    await queueTargeted(this.ctx, g.toLowerCase(), (base) => ({
      ...base,
      t: on ? "react" : "unreact",
      target: id,
      r: reaction,
    }));
    await this.controller.flush(g.toLowerCase());
  }

  markRead(g: string): void {
    const runtime = this.ctx.store.groups.get(g.toLowerCase());
    if (!runtime) {
      return;
    }
    const latest = Math.max(
      0,
      ...[...runtime.messages.values()].map((m) => (m.pending ? 0 : m.seq))
    );
    this.ctx.openConversation = runtime.record.g;
    this.ctx.openUntil = Math.max(
      this.ctx.openUntil,
      this.ctx.now() + OPEN_CONVERSATION_MS
    );
    if (latest <= runtime.record.readSeq) {
      return;
    }
    runtime.record.readSeq = latest;
    this.ctx.store.touch(runtime.record.g);
    this.background(() =>
      this.ctx.queue.run(() =>
        checkpoint(this.ctx, { groups: [runtime], skipWasm: true })
      )
    );
  }

  async rename(g: string, name: string): Promise<void> {
    this.requireReady();
    await rename(
      this.ctx,
      g.toLowerCase(),
      name,
      this.delayedFor(g.toLowerCase())
    );
  }

  async addMembers(g: string, profileIds: string[]) {
    this.requireReady();
    const result = await addMembers(
      this.ctx,
      g.toLowerCase(),
      profileIds,
      this.delayedFor(g.toLowerCase())
    );
    await resolveProfiles(this.ctx, profileIds);
    return result;
  }

  async removeMember(g: string, profileId: string): Promise<void> {
    this.requireReady();
    await removeMember(
      this.ctx,
      g.toLowerCase(),
      profileId,
      this.delayedFor(g.toLowerCase())
    );
  }

  async setAdmin(g: string, profileId: string, admin: boolean): Promise<void> {
    this.requireReady();
    await setAdmin(
      this.ctx,
      g.toLowerCase(),
      profileId,
      admin,
      this.delayedFor(g.toLowerCase())
    );
  }

  async leave(g: string): Promise<void> {
    this.requireReady();
    await leave(this.ctx, g.toLowerCase(), this.delayedFor(g.toLowerCase()));
  }

  async restart(g: string): Promise<string> {
    this.requireReady();
    const runtime = requireGroup(this.ctx, g);
    return this.createConversation({
      profileIds: restartTargets(this.ctx, runtime),
      kind: runtime.record.metadata.kind,
      name: runtime.record.metadata.name,
    });
  }

  async report(
    g: string,
    id: string,
    reason: string,
    notes?: string,
    options?: { includeOriginal?: boolean }
  ): Promise<void> {
    this.requireReady();
    await sendReport(this.ctx, g, this.ownMessage(g, id), {
      reason,
      notes,
      includeOriginal: options?.includeOriginal,
    });
  }

  reportPreview(g: string, id: string): E2eeReportPreview {
    return previewReport(this.ownMessage(g, id));
  }

  search(query: string, g?: string): Promise<E2eeMessage[]> {
    const runtimes =
      g === undefined
        ? [...this.ctx.store.groups.values()]
        : [requireGroup(this.ctx, g)];
    return Promise.resolve(searchMessages(runtimes, query).map(toE2eeMessage));
  }

  async getAttachment(g: string, id: string, blob: string): Promise<Blob> {
    this.requireReady();
    const message = this.ownMessage(g, id);
    const attachment = message.attachments.find(
      (att) => att.blob.toLowerCase() === blob.toLowerCase()
    );
    if (!attachment) {
      throw new E2eeError("E2EE_NO_ATTACHMENT");
    }
    const bytes = await downloadMedia({
      api: this.ctx.api,
      deviceKey: requireMls(this.ctx).deviceKey(),
      attachment,
    });
    return new Blob([bytes.slice().buffer], {
      type: localBlobType(attachment.mime),
    });
  }

  // -- encrypted history backup ---------------------------------------------

  backupHistory = () => backupHistory(this.ctx);

  async importBackupHistory(history: BackupHistory) {
    this.requireReady();
    const result = await this.ctx.queue.run(() =>
      importBackupHistory(this.ctx, history)
    );
    await resolveProfiles(this.ctx, memberProfileIds(this.ctx));
    return result;
  }

  // -- devices ----------------------------------------------------------------

  /**
   * "Add device": trusts the wallet for its owner and approves the device,
   * clears its notice from every chat, then adds it to each active chat the
   * owner is in (the only chats that listed it).
   */
  async trustDevice(deviceKey: string): Promise<void> {
    this.requireReady();
    const target = this.ctx.store.findUntrusted(deviceKey.toLowerCase());
    if (!target) {
      return;
    }
    await this.ctx.queue.run(() => approveDevice(this.ctx, target));
    this.ctx.store.dropUntrusted(target.deviceKey);
    const chats = [...this.ctx.store.groups].filter(
      ([, runtime]) =>
        runtime.record.status === "active" &&
        runtime.record.members.some(
          (leaf) => leaf.profileId === target.profileId
        )
    );
    for (const [g] of chats) {
      await this.controller.addOtherDevices(g);
    }
  }

  /** "Ignore": the device stays out and its notice goes away. */
  async ignoreDevice(deviceKey: string): Promise<void> {
    this.requireReady();
    const target = this.ctx.store.findUntrusted(deviceKey.toLowerCase());
    if (!target) {
      return;
    }
    await this.ctx.queue.run(() =>
      ignoreUntrustedDevice(this.ctx, target.deviceKey)
    );
    this.ctx.store.dropUntrusted(target.deviceKey);
  }

  async revokeDevice(deviceKey: string): Promise<void> {
    this.requireReady();
    const target = deviceKey.toLowerCase();
    // Decided before the request: this device's own E2EE_DEVICE_REVOKED hint
    // can arrive first and start a wipe that clears ctx.device.
    const isThisDevice = target === this.ctx.device?.deviceKey;
    await submitRevocation(this.ctx, target);
    if (isThisDevice) {
      // Queued behind a wipe the hint started, so this resolves wiped.
      await this.wipe();
      return;
    }
    await this.refreshMe();
    for (const g of this.controller.onDeviceEvent(
      true,
      this.ctx.profileId,
      target,
      false
    )) {
      await this.controller.maintain(g);
    }
  }

  async renameThisDevice(label: string): Promise<void> {
    const device = this.ctx.device;
    if (!device) {
      throw new E2eeError("E2EE_NOT_READY");
    }
    device.label = label.trim().slice(0, 48) || "Device";
    await this.ctx.queue.run(() =>
      checkpoint(this.ctx, { device, skipWasm: true })
    );
    if (this.ctx.store.thisDevice) {
      this.ctx.store.thisDevice = {
        ...this.ctx.store.thisDevice,
        label: device.label,
      };
      this.ctx.store.devices = this.ctx.store.devices.map((info) =>
        info.isThisDevice ? { ...info, label: device.label } : info
      );
    }
    this.ctx.store.touch();
  }
}

/** Creates the engine for one profile; resolves once local state is loaded. */
export async function createE2eeEngine(
  options: E2eeEngineOptions
): Promise<E2eeEngineExt> {
  const engine = new E2eeEngineImpl(createContext(options));
  await engine.init();
  return engine;
}
