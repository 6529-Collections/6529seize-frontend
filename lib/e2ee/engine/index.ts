import { recoverLoadedIdentities } from "./identity-recovery";
import {
  findSavedImport,
  getSavedMessage,
  loadSavedHistory,
  requireSavedMessage,
} from "./history-read";
import type { HistoryPageOptions } from "../history-order";
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
import { ConversationCreator } from "./conversation-creation";
import { ConversationRestarter } from "./conversation-restart";
import { UnsentMessages } from "./unsent";
import { EngineController } from "./controller";
import {
  confirmOwnRejection,
  markRevocationUnverified,
  needsNewDevice,
  refreshMe,
  renewalDue,
  renewGrant,
  submitRevocation,
} from "./enroll";
import { backupHistory, importBackupHistory } from "./backup";
import { EnrollmentFlight, NEEDS_ENROLLMENT } from "./enrollment-flight";
import { E2EE_REVOCATION_UNVERIFIED, E2eeError, errorMessage } from "./errors";
import {
  addMembers,
  checkEligibility,
  findDm,
  leave,
  removeMember,
  rename,
  setAdmin,
} from "./membership";
import { searchHistory } from "./history-search";
import { latestReadSeq } from "./history";
import { previewReport, sendReport } from "./report";
import { queueImported, queueMessage, queueTargeted } from "./send";
import {
  createContext,
  memberProfileIds,
  resolveProfiles,
  restore,
  setStatus,
  supported,
} from "./setup";
import { toE2eeMessage } from "./store";
import {
  approveDevice,
  findApprovalTarget,
  ignoreUntrustedDevice,
  isTrustedMemberDevice,
} from "./trust";

/** Contract section 12 engine: framework-agnostic, one instance per profile. */

const OPEN_CONVERSATION_MS = 60_000;

class E2eeEngineImpl implements E2eeEngineExt {
  private readonly ctx: EngineContext;
  private readonly controller: EngineController;
  private readonly conversationCreator: ConversationCreator;
  private readonly restarter: ConversationRestarter;
  private readonly unsent: UnsentMessages;
  private readonly enrollment: EnrollmentFlight;

  constructor(ctx: EngineContext) {
    this.ctx = ctx;
    ctx.store.memberTrust = (member) => isTrustedMemberDevice(ctx, member);
    this.controller = new EngineController(ctx, {
      refreshMe: () => this.refreshMe(),
      onOwnRevoked: () => this.onOwnRejected(),
      resumeLookups: async () => {
        this.ctx.lookupReads.resume();
        await this.ctx.queue.run(() => recoverLoadedIdentities(this.ctx));
        await resolveProfiles(this.ctx, memberProfileIds(this.ctx), true);
      },
      afterSync: async () => {
        await this.ctx.queue.run(() => recoverLoadedIdentities(this.ctx));
        await resolveProfiles(this.ctx, memberProfileIds(this.ctx));
      },
    });
    this.conversationCreator = new ConversationCreator(
      ctx,
      () => this.controller.syncAll(),
      () => this.requireReady(),
      this.onDelayed
    );
    this.restarter = new ConversationRestarter(ctx, this.conversationCreator);
    this.unsent = new UnsentMessages(ctx, {
      successorOf: (g) => this.restart(g),
      // Like send(), without letting a flush error fail the resend.
      requestFlush: (g) => this.background(() => this.controller.flush(g)),
    });
    this.enrollment = new EnrollmentFlight(ctx, {
      renew: () => this.renew(),
      loadDevicesAtLimit: () => this.loadDevicesAtLimit(),
      refreshMe: () => this.refreshMe(),
      start: () => this.start(),
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
        await this.enrollment.startFromLoginGrant();
        return;
      }
      if (this.ctx.device?.revocationUnverified === true) {
        // Stopped until the user acts (see recheckRevocation).
        setStatus(this.ctx, NEEDS_ENROLLMENT, E2EE_REVOCATION_UNVERIFIED);
        return;
      }
      setStatus(this.ctx, "ready");
      this.start();
    } catch (error) {
      setStatus(this.ctx, "error", errorMessage(error));
    }
  }

  /** NC8: enrolls from a combined sign-in grant stored meanwhile. */
  enrollWithLoginGrant(): Promise<E2eeEngineStatus> {
    return this.enrollment.withLoginGrant();
  }

  needsNewDevice(): Promise<boolean> {
    return this.ctx.queue.run(() => needsNewDevice(this.ctx));
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

  /** Read fresh after an await (dispose can land meanwhile). */
  private isDisposed(): boolean {
    return this.ctx.disposed;
  }

  private async refreshMe(): Promise<void> {
    if (!this.ctx.device?.registered || this.ctx.disposed) {
      return;
    }
    const result = await refreshMe(this.ctx);
    if (this.isDisposed()) {
      return;
    }
    if (result.ownRevocation === "verified") {
      await this.wipe();
    } else if (result.ownRevocation === "unverified") {
      await this.suspend(E2EE_REVOCATION_UNVERIFIED);
    }
  }

  /**
   * The server refused this device (E2EE_NOT_YOUR_DEVICE, or a revocation
   * hint). Only a revocation that /e2ee/me lists for this profile and that
   * verifies here wipes the state. A listed revocation that does not verify,
   * or an expired or unlisted device, stops the device and keeps its data
   * (enroll() renews or resumes it); an unconfirmed refusal changes nothing.
   * A disposed engine never acts: its account may already have changed.
   */
  private async onOwnRejected(): Promise<void> {
    if (this.isDisposed()) {
      return;
    }
    const verdict = await confirmOwnRejection(this.ctx);
    if (this.isDisposed() || verdict === "unconfirmed") {
      return;
    }
    if (verdict === "revoked") {
      await this.wipe();
      return;
    }
    await this.suspend(
      verdict === "revoked-unverified" ? E2EE_REVOCATION_UNVERIFIED : null
    );
  }

  /**
   * Stops using this device (no sync, no sends, no timers) and keeps every
   * local record: the device key, history, outbox and trust stay for
   * enroll(). An unverified revocation is remembered, so a reload stays
   * stopped without contacting the server.
   */
  private async suspend(code: string | null): Promise<void> {
    this.controller.stopBackground();
    this.ctx.timers.cancelAll();
    setStatus(this.ctx, NEEDS_ENROLLMENT, code);
    if (code === E2EE_REVOCATION_UNVERIFIED) {
      await this.ctx.queue.run(() => markRevocationUnverified(this.ctx, true));
    }
  }

  /**
   * Turning encrypted messages on again after an unverified revocation
   * checks the listing once: still unverified keeps the device stopped (and
   * fails), a verified one removes the local data, and a device no longer
   * listed as revoked resumes.
   */
  private async recheckRevocation(): Promise<void> {
    if (this.ctx.device?.revocationUnverified !== true) {
      return;
    }
    const { ownRevocation } = await refreshMe(this.ctx);
    if (ownRevocation === "unverified") {
      throw new E2eeError(E2EE_REVOCATION_UNVERIFIED);
    }
    if (ownRevocation === "verified") {
      await this.wipe();
      return;
    }
    await this.ctx.queue.run(() => markRevocationUnverified(this.ctx, false));
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
      this.ctx.knownDeviceProfiles.clear();
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
  getUpgrade = () => this.ctx.store.upgrade;
  getLocalDeviceKey = () => this.ctx.device?.deviceKey ?? null;
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
    await this.recheckRevocation();
    await this.enrollment.run(true);
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
    if (key !== null && changed) {
      // The conversation's historyError owns read failures and retry feedback.
      this.background(() => this.loadHistory(key).catch(() => undefined));
    }
    this.ctx.openUntil = key === null ? 0 : Number.MAX_SAFE_INTEGER;
    if (key !== null && changed && this.ctx.store.status === "ready") {
      // Contract 12: an open conversation polls every 5 s, starting now.
      this.controller.restartPolling();
      // 8.4 reconciliation on open: catch up, then look for missing devices.
      // The catch-up fetches only groups with new items, and maintenance
      // commits (and so fetches the log) only when a change is due, so
      // opening a chat does not name it (D175, P60 §1).
      this.background(async () => {
        await this.controller.syncChanged();
        await this.controller.maintain(key, { onlyIfDue: true });
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

  createConversation = (
    input: Parameters<E2eeEngineExt["createConversation"]>[0]
  ) => this.conversationCreator.create(input);

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

  private ownMessage = (g: string, id: string) =>
    requireSavedMessage(this.ctx, g, id);

  async edit(g: string, id: string, text: string): Promise<void> {
    this.requireReady();
    const message = await this.ctx.queue.run(() => this.ownMessage(g, id));
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
    const message = await this.ctx.queue.run(() => this.ownMessage(g, id));
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
    await this.ctx.queue.run(() => this.ownMessage(g, id));
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
    const latest = latestReadSeq(runtime);
    this.ctx.openConversation = runtime.record.g;
    this.ctx.openUntil = Math.max(
      this.ctx.openUntil,
      this.ctx.now() + OPEN_CONVERSATION_MS
    );
    if (latest <= runtime.record.readSeq) return;
    // Preserve the existing optimistic read intent if its background write
    // fails. A later checkpoint saves the marker and matching zero counters.
    runtime.record.readSeq = latest;
    if (runtime.record.history) {
      runtime.record.history.unread = 0;
      runtime.record.history.mentions = 0;
    }
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

  resendUnsent = (g: string, id: string) => this.unsent.resend(g, id);
  discardUnsent = (g: string, id: string) => this.unsent.discard(g, id);

  async restart(g: string): Promise<string> {
    this.requireReady();
    return this.restarter.restart(g);
  }

  async report(
    g: string,
    id: string,
    reason: string,
    notes?: string,
    options?: { includeOriginal?: boolean }
  ): Promise<void> {
    this.requireReady();
    await sendReport(
      this.ctx,
      g,
      await this.ctx.queue.run(() => this.ownMessage(g, id)),
      {
        reason,
        notes,
        includeOriginal: options?.includeOriginal,
      }
    );
  }

  async reportPreview(g: string, id: string): Promise<E2eeReportPreview> {
    return previewReport(
      await this.ctx.queue.run(() => this.ownMessage(g, id))
    );
  }

  getMessage = (g: string, id: string) => getSavedMessage(this.ctx, g, id);

  loadHistory = (
    g: string,
    options: HistoryPageOptions & { around?: string } = {}
  ) => loadSavedHistory(this.ctx, g, options);

  findImportedMessage = (
    g: string,
    waveId: string,
    dropId: string,
    part: number
  ) => findSavedImport(this.ctx, g, waveId, dropId, part);

  async search(
    query: string,
    g?: string,
    signal?: AbortSignal
  ): Promise<E2eeMessage[]> {
    if (!query.trim()) return [];
    const groups =
      g === undefined
        ? [...this.ctx.store.groups.keys()]
        : [requireGroup(this.ctx, g).record.g];
    return (await searchHistory(this.ctx, query, groups, signal)).map(
      toE2eeMessage
    );
  }

  async getAttachment(
    g: string,
    id: string,
    blob: string,
    signal?: AbortSignal
  ): Promise<Blob> {
    this.requireReady();
    const message = await this.ctx.queue.run(() => this.ownMessage(g, id));
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
      ...(signal ? { signal } : {}),
    });
    return new Blob([bytes.slice().buffer], {
      type: localBlobType(attachment.mime),
    });
  }

  // -- encrypted history backup ---------------------------------------------

  backupHistory = () => this.ctx.queue.run(() => backupHistory(this.ctx));

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
    const target = findApprovalTarget(this.ctx, deviceKey.toLowerCase());
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
    await this.ctx.queue.run(async () => {
      if (this.ctx.disposed) throw new E2eeError("E2EE_NOT_READY");
      // A superseded tab must stop before changing the account's device name.
      await checkpoint(this.ctx, { skipWasm: true });
      if (this.isDisposed()) throw new E2eeError("E2EE_NOT_READY");
      await this.ctx.api.renameDevice(device.deviceKey, label);
    });
    await this.refreshMe();
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
