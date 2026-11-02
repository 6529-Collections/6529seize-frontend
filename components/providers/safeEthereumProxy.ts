import { logErrorSecurely } from "@/utils/error-sanitizer";

/**
 * Installs a defensive wrapper around `window.ethereum` (EIP-1193 provider).
 *
 * Why this exists:
 * - Some injected providers expose methods (e.g. `request`, `on`) that rely on `this`
 *   being the provider object. If a consumer reads a method and calls it later, the
 *   binding can be lost (often surfacing as "Illegal invocation" / broken requests).
 * - Some providers can throw during property access (early initialization, unusual
 *   getters). The proxy catches these reads to avoid crashing app initialization.
 *
 * What the proxy does:
 * - Binds function properties to the underlying provider so `this` is preserved.
 * - Returns `undefined` for properties whose access throws.
 *
 * This runs once per page load and only touches `window.ethereum`.
 */
export function installSafeEthereumProxy(): void {
  if (typeof window === "undefined") return;

  const w = globalThis as unknown as {
    ethereum?: unknown;
    __6529_safeEthereumProxyInstalled?: boolean | undefined;
  };

  if (w.__6529_safeEthereumProxyInstalled === true) return;

  const ethereum = w.ethereum;
  if (
    ethereum === undefined ||
    ethereum === null ||
    (typeof ethereum !== "object" && typeof ethereum !== "function")
  ) {
    w.__6529_safeEthereumProxyInstalled = true;
    return;
  }

  const ownEthereumDescriptor = Object.getOwnPropertyDescriptor(w, "ethereum");
  if (
    ownEthereumDescriptor?.configurable === false &&
    !canAssignProperty(ownEthereumDescriptor)
  ) {
    logErrorSecurely(
      "[WagmiSetup] Skipping safe ethereum proxy install for read-only window.ethereum",
      new Error("window.ethereum cannot be reassigned")
    );
    w.__6529_safeEthereumProxyInstalled = true;
    return;
  }

  try {
    let hasLoggedProxyGetError = false;
    const ethereumTarget = ethereum;
    const proxy = new Proxy(ethereumTarget, {
      get(target, prop): unknown {
        try {
          const value: unknown = Reflect.get(target, prop, target);
          if (typeof value === "function") {
            const method = value as (
              this: unknown,
              ...args: unknown[]
            ) => unknown;
            return method.bind(target);
          }
          return value;
        } catch (error) {
          if (!hasLoggedProxyGetError) {
            hasLoggedProxyGetError = true;
            const propLabel =
              typeof prop === "symbol" ? prop.toString() : String(prop);
            logErrorSecurely(
              `[WagmiSetup] ethereum proxy getter failed (prop: ${propLabel})`,
              error
            );
          }
          return undefined;
        }
      },
    });

    if (ownEthereumDescriptor?.configurable === false) {
      w.ethereum = proxy;
    } else {
      Object.defineProperty(w, "ethereum", {
        configurable: true,
        enumerable: ownEthereumDescriptor?.enumerable ?? true,
        writable: true,
        value: proxy,
      });
    }
    w.__6529_safeEthereumProxyInstalled = true;
  } catch (error) {
    logErrorSecurely(
      "[WagmiSetup] Failed to install safe ethereum proxy",
      error
    );
    w.__6529_safeEthereumProxyInstalled = true;
  }
}

function canAssignProperty(descriptor: PropertyDescriptor): boolean {
  if ("get" in descriptor || "set" in descriptor) {
    return typeof descriptor.set === "function";
  }

  return descriptor.writable !== false;
}
