"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toDataURL } from "qrcode";
import {
  createDeviceCode,
  approveDeviceCode,
  type DeviceCodeResponse,
  type ApproveResponse,
} from "@/services/auth/community-app-auth.utils";
import { generatePkcePairBrowser } from "@/services/auth/pkce.utils";

type DeviceAuthStatus =
  | "loading"
  | "qr-ready"
  | "approved"
  | "redirecting"
  | "error";

interface DeviceAuthState {
  readonly status: DeviceAuthStatus;
  readonly message: string;
  readonly qrSrc: string;
  readonly userCode: string;
  readonly approveResult: ApproveResponse | null;
  readonly pkceVerifier: string;
  readonly deviceCode: string;
}

const POLL_INTERVAL_MS = 3000;
const QR_SIZE = 400;

export default function AuthDevicePageClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<DeviceAuthState>({
    status: "loading",
    message: "",
    qrSrc: "",
    userCode: "",
    approveResult: null,
    pkceVerifier: "",
    deviceCode: "",
  });
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope") ?? "identity:read";
  const stateParam = searchParams.get("state");
  const codeChallenge = searchParams.get("code_challenge");

  const handleRedirect = useCallback(
    (deviceCode: string) => {
      setState((prev) => ({
        ...prev,
        status: "redirecting",
      }));

      const callbackUrl = new URL(redirectUri!);
      callbackUrl.searchParams.set("device_code", deviceCode);
      callbackUrl.searchParams.set("state", stateParam ?? "");
      window.location.href = callbackUrl.toString();
    },
    [redirectUri, stateParam]
  );

  useEffect(() => {
    if (!clientId || !redirectUri) {
      setState({
        status: "error",
        message:
          "Missing required parameters (client_id, redirect_uri). Please return to the community app and try again.",
        qrSrc: "",
        userCode: "",
        approveResult: null,
        pkceVerifier: "",
        deviceCode: "",
      });
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    async function initDeviceAuth() {
      try {
        let pkceVerifier = "";
        let challenge = codeChallenge;

        // If community app didn't pass code_challenge, generate our own PKCE pair
        if (!challenge) {
          const pkcePair = await generatePkcePairBrowser();
          pkceVerifier = pkcePair.verifier;
          challenge = pkcePair.challenge;
        }

        const response: DeviceCodeResponse = await createDeviceCode({
          clientId: clientId!,
          redirectUri: redirectUri!,
          scope,
          codeChallenge: challenge!,
          codeChallengeMethod: "S256",
        });

        if (cancelled) return;

        // Build QR payload — encodes 6529.io approval page with user_code
        const qrPayload = `${window.location.origin}/auth/device/approve?user_code=${response.user_code}`;
        const qrSrc = await toDataURL(qrPayload, {
          width: QR_SIZE,
          margin: 4,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        if (cancelled) return;

        setState({
          status: "qr-ready",
          message:
            "Scan this QR code with your phone to authorize the community app.",
          qrSrc,
          userCode: response.user_code,
          approveResult: null,
          pkceVerifier,
          deviceCode: response.device_code,
        });

        // Start polling for approval
        pollIntervalRef.current = setInterval(async () => {
          if (cancelled) return;
          try {
            const approveResult = await approveDeviceCode(response.user_code);
            if (approveResult && !cancelled) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              setState((prev) => ({
                ...prev,
                status: "approved",
                approveResult,
              }));
              // Redirect after short delay so user sees the approval confirmation
              setTimeout(() => {
                if (!cancelled) handleRedirect(response.device_code);
              }, 1500);
            }
          } catch {
            // Approval not yet given — continue polling
          }
        }, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Failed to start authorization. Please try again.",
          qrSrc: "",
          userCode: "",
          approveResult: null,
          pkceVerifier: "",
          deviceCode: "",
        });
      }
    }

    initDeviceAuth();

    return () => {
      cancelled = true;
      abortController.abort();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, redirectUri, scope, stateParam, codeChallenge]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "1.75rem",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        6529 Community App Authorization
      </h1>

      {state.status === "loading" && (
        <p style={{ color: "#888" }}>Preparing authorization…</p>
      )}

      {state.status === "qr-ready" && (
        <>
          <p
            style={{
              marginBottom: "1.5rem",
              textAlign: "center",
              maxWidth: "500px",
              color: "#ccc",
            }}
          >
            {state.message}
          </p>
          {state.qrSrc && (
            <img
              src={state.qrSrc}
              alt="QR Code"
              style={{
                borderRadius: "12px",
                border: "2px solid #333",
                marginBottom: "1rem",
              }}
            />
          )}
          <p
            style={{
              fontSize: "0.9rem",
              color: "#888",
              marginTop: "0.5rem",
            }}
          >
            Or enter code manually:{" "}
            <code
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                letterSpacing: "0.15em",
                color: "#fff",
                background: "#222",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              {state.userCode}
            </code>
          </p>
        </>
      )}

      {state.status === "approved" && (
        <div style={{ textAlign: "center" }}>
          {state.approveResult && (
            <>
              <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                ✓ Authorized
              </p>
              <p style={{ color: "#ccc", marginBottom: "0.5rem" }}>
                {state.approveResult.client_name}
              </p>
              <p style={{ color: "#888", fontSize: "0.9rem" }}>
                Redirecting you back…
              </p>
            </>
          )}
        </div>
      )}

      {state.status === "redirecting" && (
        <p style={{ color: "#888" }}>Redirecting…</p>
      )}

      {state.status === "error" && (
        <div style={{ textAlign: "center", maxWidth: "500px" }}>
          <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>
            {state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}