import { decodeBinaryFrame } from "./relay-bytes";
import type { RelayItem } from "./relay-records";
import { relayAuthDigest } from "./relay-records";

/**
 * A read-only CRP v1 client (the relays' WebSocket protocol, JSON text
 * frames `{"t": ...}`) with the relays' AUTH and binary payload frames.
 * It reads streams page by page and payloads by hash; it never publishes.
 */
export interface CrpTransport {
  send(data: string): void;
  close(): void;
  onMessage(listener: (data: string | Uint8Array) => void): void;
  onClose(listener: () => void): void;
}

export type CrpOpener = (url: string) => Promise<CrpTransport>;

/** CRP's GrantProof, as `GET e2ee/me` lists the caller's. */
export interface RelayGrantProof {
  readonly id: string;
  readonly message: string;
  readonly wallet_signature: string;
  readonly chain_id: number;
  readonly wallet: string;
  readonly device_key: string;
  readonly scopes: readonly string[];
  readonly domain: string;
  readonly expires_at: number;
  readonly revoked_at: number | null;
}

export interface RelayAuth {
  readonly grant: RelayGrantProof;
  /** Signs a 32-byte digest with the grant's device key (0x-hex). */
  readonly sign: (digest: string) => Promise<string>;
}

type Frame = Record<string, unknown> & { readonly t: string };

interface Pending {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export class RelayReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelayReadError";
  }
}

export class RelayConnection {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private closed = false;
  private welcome: Frame | null = null;
  private challenge: string | null = null;
  private readonly waiters: ((frame: Frame) => void)[] = [];

  private constructor(
    private readonly transport: CrpTransport,
    private readonly timeoutMs: number
  ) {
    transport.onMessage((data) => this.receive(data));
    transport.onClose(() => this.fail("closed"));
  }

  /** Connects, says HELLO and answers the CHALLENGE with the device key. */
  static async open(input: {
    readonly url: string;
    readonly net: string;
    readonly auth: RelayAuth;
    readonly open?: CrpOpener | undefined;
    readonly timeoutMs?: number | undefined;
  }): Promise<RelayConnection> {
    const transport = await (input.open ?? openBrowserCrpSocket)(input.url);
    const connection = new RelayConnection(
      transport,
      input.timeoutMs ?? DEFAULT_TIMEOUT_MS
    );
    try {
      await connection.handshake(input.net, input.auth);
    } catch (error) {
      connection.close();
      throw error;
    }
    return connection;
  }

  get isOpen(): boolean {
    return !this.closed;
  }

  private async handshake(net: string, auth: RelayAuth): Promise<void> {
    this.transport.send(
      JSON.stringify({ t: "HELLO", v: 1, net, role: "client" })
    );
    const welcome = this.welcome ?? (await this.next("WELCOME"));
    if (welcome["net"] !== net) {
      throw new RelayReadError("The relay is on another network");
    }
    const nonce =
      this.challenge ?? String((await this.next("CHALLENGE"))["nonce"]);
    const digest = relayAuthDigest({
      net,
      relayId: String(welcome["relay_id"]),
      nonce,
      grantId: auth.grant.id,
    });
    await this.request({
      t: "AUTH",
      grant: auth.grant,
      sig: await auth.sign(digest),
    });
  }

  private next(type: string): Promise<Frame> {
    return this.withTimeout(
      new Promise<Frame>((resolve) => {
        const waiter = (frame: Frame) => {
          if (frame.t !== type) return;
          this.waiters.splice(this.waiters.indexOf(waiter), 1);
          resolve(frame);
        };
        this.waiters.push(waiter);
      })
    );
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new RelayReadError("The relay did not answer")),
        this.timeoutMs
      );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  private request(frame: Omit<Frame, "rid">): Promise<unknown> {
    if (this.closed) return Promise.reject(new RelayReadError("closed"));
    const rid = this.nextId++;
    const answer = new Promise<unknown>((resolve, reject) => {
      this.pending.set(rid, { resolve, reject });
    });
    this.transport.send(JSON.stringify({ ...frame, rid }));
    return this.withTimeout(answer).finally(() => this.pending.delete(rid));
  }

  /** One page of a stream after `after` (an rseq; 0 is its start). */
  async history(
    wave: string,
    after: number,
    limit: number
  ): Promise<{ readonly items: RelayItem[]; readonly more: boolean }> {
    const res = (await this.request({ t: "HIST", wave, after, limit })) as Frame;
    const items = Array.isArray(res["items"])
      ? (res["items"] as RelayItem[])
      : [];
    return { items, more: res["more"] === true };
  }

  /** A payload's bytes by sha256 (checked by the caller). */
  async payload(sha256: string): Promise<Uint8Array> {
    const bytes = await this.request({ t: "PAYLOAD_GET", sha256 });
    if (!(bytes instanceof Uint8Array)) {
      throw new RelayReadError(`No payload ${sha256}`);
    }
    return bytes;
  }

  close(): void {
    if (!this.closed) this.transport.close();
    this.fail("closed by the client");
  }

  private fail(reason: string): void {
    if (this.closed) return;
    this.closed = true;
    const error = new RelayReadError(`Relay connection ${reason}`);
    for (const pending of Array.from(this.pending.values())) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  private receive(data: string | Uint8Array): void {
    if (typeof data !== "string") {
      const { header, bytes } = decodeBinaryFrame(data);
      if (header["t"] === "PAYLOAD") {
        this.pending.get(Number(header["rid"]))?.resolve(bytes);
      }
      return;
    }
    const frame = JSON.parse(data) as Frame;
    if (frame.t === "WELCOME") this.welcome = frame;
    if (frame.t === "CHALLENGE") this.challenge = String(frame["nonce"]);
    for (const waiter of [...this.waiters]) waiter(frame);
    if (frame.t === "ERR") {
      const reason = frame["reason"];
      const error = new RelayReadError(
        typeof reason === "string" ? reason : "relay error"
      );
      if (frame["rid"] === null || frame["rid"] === undefined) {
        this.fail(error.message);
        return;
      }
      this.pending.get(Number(frame["rid"]))?.reject(error);
      return;
    }
    if (typeof frame["rid"] === "number") {
      this.pending.get(frame["rid"])?.resolve(frame);
    }
  }
}

/** A CRP socket on the browser's WebSocket. */
function openBrowserCrpSocket(url: string): Promise<CrpTransport> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    const messages: ((data: string | Uint8Array) => void)[] = [];
    const closes: (() => void)[] = [];
    socket.addEventListener("message", (event: MessageEvent) => {
      const data =
        typeof event.data === "string"
          ? event.data
          : new Uint8Array(event.data as ArrayBuffer);
      messages.forEach((listener) => listener(data));
    });
    socket.addEventListener("close", () => {
      closes.forEach((listener) => listener());
    });
    socket.addEventListener("error", () =>
      reject(new RelayReadError(`Could not reach ${url}`))
    );
    socket.addEventListener("open", () =>
      resolve({
        send: (data) => socket.send(data),
        close: () => socket.close(),
        onMessage: (listener) => messages.push(listener),
        onClose: (listener) => closes.push(listener),
      })
    );
  });
}
