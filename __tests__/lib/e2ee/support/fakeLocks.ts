/**
 * In-memory Web Locks (exclusive mode: ifAvailable, steal, signal) and a
 * BroadcastChannel bus, shared by every "tab" in one test.
 */

interface Holder {
  readonly reject: (error: unknown) => void;
}

interface Waiter {
  readonly grant: () => void;
}

const abortError = () =>
  new DOMException("The operation was aborted.", "AbortError");

export function createFakeLocks(): LockManager & {
  isHeld(name: string): boolean;
} {
  const held = new Map<string, Holder>();
  const queues = new Map<string, Waiter[]>();

  const next = (name: string) => {
    const queue = queues.get(name) ?? [];
    const waiter = queue.shift();
    waiter?.grant();
  };

  const request = (
    name: string,
    optionsOrCallback: LockOptions | LockGrantedCallback<unknown>,
    maybeCallback?: LockGrantedCallback<unknown>
  ): Promise<unknown> => {
    const options =
      typeof optionsOrCallback === "function" ? {} : optionsOrCallback;
    const callback = (
      typeof optionsOrCallback === "function"
        ? optionsOrCallback
        : maybeCallback
    ) as LockGrantedCallback<unknown>;
    return new Promise<unknown>((resolve, reject) => {
      const run = () => {
        const holder: Holder = { reject };
        held.set(name, holder);
        Promise.resolve()
          .then(() => callback({ name, mode: "exclusive" } as Lock))
          .then(
            (value) => {
              if (held.get(name) === holder) {
                held.delete(name);
                next(name);
              }
              resolve(value);
            },
            (error: unknown) => {
              if (held.get(name) === holder) {
                held.delete(name);
                next(name);
              }
              reject(error);
            }
          );
      };
      if (options.steal) {
        const previous = held.get(name);
        held.delete(name);
        previous?.reject(abortError());
        run();
        return;
      }
      if (!held.has(name)) {
        run();
        return;
      }
      if (options.ifAvailable) {
        Promise.resolve()
          .then(() => callback(null))
          .then(resolve, reject);
        return;
      }
      const queue = queues.get(name) ?? [];
      const waiter: Waiter = { grant: run };
      queue.push(waiter);
      queues.set(name, queue);
      options.signal?.addEventListener("abort", () => {
        const index = queue.indexOf(waiter);
        if (index >= 0) {
          queue.splice(index, 1);
          reject(abortError());
        }
      });
    });
  };

  return {
    request,
    query: () => Promise.resolve({ held: [], pending: [] }),
    isHeld: (name: string) => held.has(name),
  } as unknown as LockManager & { isHeld(name: string): boolean };
}

type Listener = (event: MessageEvent) => void;

/** BroadcastChannel stand-in: delivers to every other open channel of the name. */
export function createFakeChannels(): (name: string) => BroadcastChannel {
  const open = new Map<string, Set<FakeChannel>>();

  class FakeChannel {
    private readonly listeners = new Set<Listener>();
    private closed = false;

    constructor(readonly name: string) {
      const peers = open.get(name) ?? new Set<FakeChannel>();
      peers.add(this);
      open.set(name, peers);
    }

    postMessage(data: unknown): void {
      if (this.closed) {
        return;
      }
      for (const peer of open.get(this.name) ?? []) {
        if (peer !== this) {
          setTimeout(() => {
            peer.deliver(data);
          }, 0);
        }
      }
    }

    deliver(data: unknown): void {
      if (this.closed) {
        return;
      }
      for (const listener of [...this.listeners]) {
        listener({ data } as MessageEvent);
      }
    }

    addEventListener(_type: "message", listener: Listener): void {
      this.listeners.add(listener);
    }

    removeEventListener(_type: "message", listener: Listener): void {
      this.listeners.delete(listener);
    }

    close(): void {
      this.closed = true;
      open.get(this.name)?.delete(this);
    }
  }

  return (name: string) => new FakeChannel(name) as unknown as BroadcastChannel;
}
