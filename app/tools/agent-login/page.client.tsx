"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { getAddress, isAddress } from "viem";
import { AGENT_LOGIN_ACTIVE_ADDRESS_STORAGE_KEY } from "@/services/auth/auth.utils";

const STORAGE_KEYS = {
  accounts: "6529-wallet-accounts",
  activeAddress: "6529-wallet-active-address",
  legacyAddress: "6529-wallet-address",
  legacyRefreshToken: "6529-wallet-refresh-token",
  legacyRole: "6529-wallet-role",
  agentLoginActiveAddress: AGENT_LOGIN_ACTIVE_ADDRESS_STORAGE_KEY,
  authCookie: "wallet-auth",
} as const;

const WALLET_ACCOUNTS_UPDATED_EVENT = "6529-wallet-accounts-updated";
const AUTH_TOKEN_CHANGED_EVENT = "6529-auth-token-changed";
const PROFILE_SWITCHED_EVENT = "6529-profile-switched";

type Status = {
  readonly kind: "idle" | "success" | "error";
  readonly message: string;
};

type AgentLoginPayload = {
  readonly account: {
    readonly profileHandle: string | null;
  };
  readonly session: {
    readonly address: string;
    readonly role: string | null;
    readonly accessToken: string;
    readonly accessTokenExpiresAt: string | null;
  };
};

type StoredWalletAccount = {
  readonly address: string;
  readonly refreshToken: null;
  readonly role: string | null;
  readonly jwt: string;
  readonly profileId: null;
  readonly profileHandle: string | null;
  readonly authSessionVersion: "v2";
};

const styles = {
  main: {
    minHeight: "100vh",
    background: "#101418",
    color: "#f7fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
  },
  panel: {
    width: "min(720px, 100%)",
    border: "1px solid #2f3b45",
    borderRadius: 8,
    background: "#161c22",
    padding: 24,
    boxShadow: "0 24px 60px rgb(0 0 0 / 28%)",
  },
  title: {
    fontSize: 22,
    lineHeight: 1.25,
    margin: "0 0 8px",
  },
  copy: {
    color: "#b7c1cc",
    fontSize: 14,
    lineHeight: 1.5,
    margin: "0 0 18px",
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#d8e0e8",
    marginBottom: 8,
  },
  textarea: {
    width: "100%",
    minHeight: 220,
    boxSizing: "border-box",
    resize: "vertical",
    borderRadius: 6,
    border: "1px solid #44525f",
    background: "#0d1116",
    color: "#edf3f8",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 13,
    lineHeight: 1.45,
    padding: 12,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  button: {
    border: "1px solid #556573",
    borderRadius: 6,
    background: "#f7fafc",
    color: "#101418",
    minHeight: 38,
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #556573",
    borderRadius: 6,
    background: "transparent",
    color: "#f7fafc",
    minHeight: 38,
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.55,
  },
  status: {
    minHeight: 22,
    marginTop: 14,
    fontSize: 13,
    lineHeight: 1.45,
  },
  success: {
    color: "#79e6a8",
  },
  error: {
    color: "#ff9d9d",
  },
} satisfies Record<string, CSSProperties>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value;
}

function getRequiredString(
  record: Record<string, unknown>,
  key: string
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string.`);
  }
  return value.trim();
}

function getOptionalString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function parseAgentLoginPayload(rawPayload: string): AgentLoginPayload {
  const parsed = getRecord(JSON.parse(rawPayload), "Payload");
  const account = getRecord(parsed["account"], "account");
  const session = getRecord(parsed["session"], "session");
  const sessionAddress = getRequiredString(session, "address");

  if (!isAddress(sessionAddress)) {
    throw new Error("address must be a valid Ethereum address.");
  }

  return {
    account: {
      profileHandle: getOptionalString(account, "profileHandle"),
    },
    session: {
      address: getAddress(sessionAddress),
      role: getOptionalString(session, "role"),
      accessToken: getRequiredString(session, "accessToken"),
      accessTokenExpiresAt: getOptionalString(session, "accessTokenExpiresAt"),
    },
  };
}

function clearStoredRoleKeys(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("auth-role-")) {
      localStorage.removeItem(key);
    }
  }
}

function getCookieExpiresAttribute(expiresAt: string | null): string {
  if (!expiresAt) {
    return "";
  }

  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return `; expires=${new Date(timestamp).toUTCString()}`;
}

function getSecureCookieAttribute(): string {
  return globalThis.location.protocol === "https:" ? "; Secure" : "";
}

function dispatchAuthEvents(): void {
  globalThis.dispatchEvent(new CustomEvent(WALLET_ACCOUNTS_UPDATED_EVENT));
  globalThis.dispatchEvent(new CustomEvent(AUTH_TOKEN_CHANGED_EVENT));
  globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
}

function applyLoginPayload(payload: AgentLoginPayload): void {
  const account: StoredWalletAccount = {
    address: payload.session.address,
    refreshToken: null,
    role: payload.session.role,
    jwt: payload.session.accessToken,
    profileId: null,
    profileHandle: payload.account.profileHandle,
    authSessionVersion: "v2",
  };

  clearStoredRoleKeys();
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify([account]));
  localStorage.setItem(STORAGE_KEYS.activeAddress, account.address);
  localStorage.setItem(STORAGE_KEYS.legacyAddress, account.address);
  localStorage.setItem(STORAGE_KEYS.agentLoginActiveAddress, account.address);
  localStorage.removeItem(STORAGE_KEYS.legacyRefreshToken);

  if (account.role) {
    localStorage.setItem(STORAGE_KEYS.legacyRole, account.role);
    localStorage.setItem(
      `auth-role-${account.address.toLowerCase()}`,
      account.role
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.legacyRole);
  }

  document.cookie = `${STORAGE_KEYS.authCookie}=${encodeURIComponent(
    account.jwt
  )}; path=/; SameSite=Strict${getCookieExpiresAttribute(
    payload.session.accessTokenExpiresAt
  )}${getSecureCookieAttribute()}`;
  dispatchAuthEvents();
}

function clearAuthState(): void {
  localStorage.removeItem(STORAGE_KEYS.accounts);
  localStorage.removeItem(STORAGE_KEYS.activeAddress);
  localStorage.removeItem(STORAGE_KEYS.legacyAddress);
  localStorage.removeItem(STORAGE_KEYS.legacyRefreshToken);
  localStorage.removeItem(STORAGE_KEYS.legacyRole);
  localStorage.removeItem(STORAGE_KEYS.agentLoginActiveAddress);
  clearStoredRoleKeys();
  document.cookie = `${
    STORAGE_KEYS.authCookie
  }=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${getSecureCookieAttribute()}`;
  dispatchAuthEvents();
}

function shortAddress(address: string): string {
  return address.length > 12
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
}

function getCurrentAuthStatus(): Status {
  try {
    const activeAddress = localStorage.getItem(STORAGE_KEYS.activeAddress);
    const agentLoginAddress = localStorage.getItem(
      STORAGE_KEYS.agentLoginActiveAddress
    );
    const rawAccounts = localStorage.getItem(STORAGE_KEYS.accounts);

    if (
      !activeAddress ||
      !rawAccounts ||
      agentLoginAddress?.toLowerCase() !== activeAddress.toLowerCase()
    ) {
      return {
        kind: "idle",
        message: "No active agent auth.",
      };
    }

    const parsedAccounts: unknown = JSON.parse(rawAccounts);
    if (!Array.isArray(parsedAccounts)) {
      return {
        kind: "error",
        message: "Stored agent auth is unreadable.",
      };
    }

    const activeAccount = parsedAccounts
      .filter(isRecord)
      .find(
        (account) =>
          typeof account["address"] === "string" &&
          account["address"].toLowerCase() === activeAddress.toLowerCase()
      );
    const hasToken =
      typeof activeAccount?.["jwt"] === "string" &&
      activeAccount["jwt"].trim().length > 0;

    return {
      kind: hasToken ? "success" : "error",
      message: hasToken
        ? `Current account: ${shortAddress(activeAddress)}.`
        : `Current account: ${shortAddress(activeAddress)} is missing a token.`,
    };
  } catch {
    return {
      kind: "error",
      message: "Stored agent auth is unreadable.",
    };
  }
}

function redirectHomeSoon(): void {
  globalThis.setTimeout(() => {
    globalThis.location.assign("/");
  }, 250);
}

export default function AgentLoginClient() {
  const [rawPayload, setRawPayload] = useState("");
  const [status, setStatus] = useState<Status>({
    kind: "idle",
    message: "",
  });
  const isApplyDisabled = rawPayload.trim().length === 0;

  useEffect(() => {
    setStatus(getCurrentAuthStatus());
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload = parseAgentLoginPayload(rawPayload);
      applyLoginPayload(payload);
      setRawPayload("");
      setStatus({
        kind: "success",
        message: `Logged in as ${shortAddress(payload.session.address)}. Redirecting...`,
      });
      redirectHomeSoon();
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Could not apply login.",
      });
    }
  };

  const onLogout = () => {
    clearAuthState();
    setRawPayload("");
    setStatus({
      kind: "success",
      message: "Logged out. Redirecting...",
    });
    redirectHomeSoon();
  };

  return (
    <main style={styles.main}>
      <section aria-labelledby="agent-login-title" style={styles.panel}>
        <h1 id="agent-login-title" style={styles.title}>
          Agent Login
        </h1>
        <p style={styles.copy}>
          Paste a local agent login JSON payload. Tokens stay in this browser
          origin and are not sent to another route.
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="agent-login-payload" style={styles.label}>
            Login payload
          </label>
          <textarea
            id="agent-login-payload"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={rawPayload}
            onChange={(event) => setRawPayload(event.target.value)}
            placeholder='{"account": {...}, "session": {...}}'
            style={styles.textarea}
          />
          <div style={styles.actions}>
            <button
              type="submit"
              disabled={isApplyDisabled}
              style={{
                ...styles.button,
                ...(isApplyDisabled ? styles.disabledButton : undefined),
              }}>
              Apply
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={styles.secondaryButton}>
              Logout
            </button>
          </div>
        </form>
        <div
          aria-live="polite"
          role="status"
          style={{
            ...styles.status,
            ...(status.kind === "success" ? styles.success : undefined),
            ...(status.kind === "error" ? styles.error : undefined),
          }}>
          {status.message}
        </div>
      </section>
    </main>
  );
}
