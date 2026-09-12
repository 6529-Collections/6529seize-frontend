"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

type AuthorizeStatus =
  | "loading"
  | "not-logged-in"
  | "confirm"
  | "approving"
  | "redirecting"
  | "error";

interface AppInfo {
  readonly app_id: string;
  readonly name: string;
  readonly description: string;
}

export default function AuthAuthorizePageClient() {
  const searchParams = useSearchParams();
  const {
    connectedProfile,
    connectionStatus,
    requestAuth,
  } = useAuth();

  const appId = searchParams.get("app");
  const redirectUri = searchParams.get("redirect_uri");
  const stateParam = searchParams.get("state");

  const [status, setStatus] = useState<AuthorizeStatus>("loading");
  const [message, setMessage] = useState("");
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("");

  // Fetch app info on mount
  useEffect(() => {
    if (!appId || !redirectUri) {
      setStatus("error");
      setMessage(
        "Missing required parameters (app, redirect_uri). Please return to the community app and try again."
      );
      return;
    }

    async function fetchAppInfo() {
      try {
        const info = await commonApiFetch<AppInfo>({
          endpoint: "auth/authorize/app-info",
          params: { app: appId!, redirect_uri: redirectUri! },
        });
        setAppInfo(info);
        setStatus("confirm");
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to validate community app. Please try again."
        );
      }
    }

    fetchAppInfo();
  }, [appId, redirectUri]);

  // If user is not logged in, show login prompt
  useEffect(() => {
    if (
      status === "confirm" &&
      connectionStatus === ProfileConnectedStatus.NOT_CONNECTED
    ) {
      setStatus("not-logged-in");
    } else if (
      status === "not-logged-in" &&
      connectionStatus !== ProfileConnectedStatus.NOT_CONNECTED
    ) {
      setStatus("confirm");
    }
  }, [status, connectionStatus]);

  async function handleApprove() {
    if (!appId || !redirectUri) return;
    setStatus("approving");
    try {
      const result = await commonApiPost<
        {
          readonly app: string;
          readonly redirect_uri: string;
          readonly state?: string;
        },
        { readonly redirect_url: string }
      >({
        endpoint: "auth/authorize/approve",
        body: {
          app: appId,
          redirect_uri: redirectUri,
          ...(stateParam ? { state: stateParam } : {}),
        },
      });
      setRedirectUrl(result.redirect_url);
      setStatus("redirecting");
      // Brief delay so user sees the redirecting state
      setTimeout(() => {
        window.location.href = result.redirect_url;
      }, 800);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Authorization failed. Please try again."
      );
    }
  }

  async function handleLogin() {
    const result = await requestAuth();
    if (!result.success) {
      setStatus("error");
      setMessage("Failed to connect wallet. Please try again.");
    }
    // The connectionStatus effect will move us back to "confirm"
  }

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
      {/* 6529 branding */}
      <div
        style={{
          fontSize: "1.4rem",
          fontWeight: "bold",
          marginBottom: "2rem",
          letterSpacing: "0.05em",
        }}
      >
        6529.io
      </div>

      {status === "loading" && (
        <p style={{ color: "#888" }}>Loading…</p>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center", maxWidth: "450px" }}>
          <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>
            {message}
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

      {status === "not-logged-in" && (
        <div style={{ textAlign: "center", maxWidth: "450px" }}>
          {appInfo && (
            <p
              style={{
                fontSize: "1.1rem",
                marginBottom: "1rem",
                color: "#ccc",
              }}
            >
              <strong style={{ color: "#fff" }}>{appInfo.name}</strong> wants
              to verify your 6529 identity.
            </p>
          )}
          <p
            style={{
              marginBottom: "1.5rem",
              color: "#888",
              fontSize: "0.95rem",
            }}
          >
            You need to be logged in to 6529.io to authorize this app.
          </p>
          <button
            onClick={handleLogin}
            style={{
              background: "#22c55e",
              color: "#000",
              border: "none",
              padding: "0.75rem 2.5rem",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Connect Wallet
          </button>
        </div>
      )}

      {(status === "confirm" || status === "approving") && (
        <div style={{ textAlign: "center", maxWidth: "450px" }}>
          {appInfo && (
            <>
              <p
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "0.5rem",
                }}
              >
                <strong>{appInfo.name}</strong>
              </p>
              <p
                style={{
                  color: "#888",
                  fontSize: "0.9rem",
                  marginBottom: "1.5rem",
                }}
              >
                {appInfo.description}
              </p>
            </>
          )}

          {/* User profile card */}
          {connectedProfile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.5rem",
                padding: "1rem",
                borderRadius: "12px",
                background: "#111",
                border: "1px solid #333",
              }}
            >
              {connectedProfile.pfp?.url && (
                <img
                  src={connectedProfile.pfp.url}
                  alt="PFP"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}
              <div style={{ textAlign: "left" }}>
                <p style={{ fontWeight: "bold", margin: 0 }}>
                  {connectedProfile.handle ??
                    connectedProfile.display ??
                    "User"}
                </p>
                {connectedProfile.level && (
                  <p
                    style={{
                      color: "#888",
                      fontSize: "0.85rem",
                      margin: 0,
                    }}
                  >
                    Level {connectedProfile.level}
                  </p>
                )}
              </div>
            </div>
          )}

          <p
            style={{
              marginBottom: "1.5rem",
              color: "#ccc",
              fontSize: "0.95rem",
            }}
          >
            This app will receive your wallet address and can access your public
            6529 profile. No transaction will be made. No gas will be spent.
          </p>

          <button
            onClick={handleApprove}
            disabled={status === "approving"}
            style={{
              background: status === "approving" ? "#333" : "#22c55e",
              color: status === "approving" ? "#888" : "#000",
              border: "none",
              padding: "0.75rem 2.5rem",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: status === "approving" ? "default" : "pointer",
            }}
          >
            {status === "approving" ? "Authorizing…" : "Authorize"}
          </button>
        </div>
      )}

      {status === "redirecting" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>✓</p>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            Authorized!
          </p>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            Redirecting you back…
          </p>
        </div>
      )}
    </div>
  );
}