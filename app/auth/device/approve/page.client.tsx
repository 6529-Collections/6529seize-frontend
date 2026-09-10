"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { approveDeviceCode, type ApproveResponse } from "@/services/auth/community-app-auth.utils";

type ApproveStatus = "loading" | "confirm" | "approving" | "approved" | "error";

export default function AuthDeviceApprovePageClient() {
  const searchParams = useSearchParams();
  const { connectedProfile } = useAuth();
  const userCode = searchParams.get("user_code");

  const [status, setStatus] = useState<ApproveStatus>("loading");
  const [message, setMessage] = useState("");
  const [approveResult, setApproveResult] = useState<ApproveResponse | null>(
    null
  );

  useEffect(() => {
    if (!userCode) {
      setStatus("error");
      setMessage("Missing user code. Please scan the QR code again.");
      return;
    }
    setStatus("confirm");
  }, [userCode]);

  async function handleApprove() {
    if (!userCode) return;
    setStatus("approving");
    try {
      const result = await approveDeviceCode(userCode);
      setApproveResult(result);
      setStatus("approved");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Authorization failed. The code may be invalid or expired."
      );
    }
  }

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#000",
        }}
      >
        <Spinner />
      </div>
    );
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
      <h1
        style={{
          fontSize: "1.5rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Authorize Community App
      </h1>

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
          <div>
            <p style={{ fontWeight: "bold", margin: 0 }}>
              {connectedProfile.handle ?? connectedProfile.display ?? "User"}
            </p>
            {connectedProfile.level && (
              <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>
                Level {connectedProfile.level}
              </p>
            )}
          </div>
        </div>
      )}

      {status === "confirm" && (
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p
            style={{
              marginBottom: "1rem",
              color: "#ccc",
            }}
          >
            A community app is requesting access to your 6529 identity
            (read-only). Your wallet address and profile will be shared with
            the app.
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#888",
              marginBottom: "1.5rem",
            }}
          >
            Scope: <code style={{ color: "#fff" }}>identity:read</code>
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#888",
              marginBottom: "1.5rem",
            }}
          >
            User code:{" "}
            <code
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                letterSpacing: "0.15em",
                color: "#fff",
                background: "#222",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              {userCode}
            </code>
          </p>
          <button
            onClick={handleApprove}
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
            Authorize
          </button>
        </div>
      )}

      {status === "approving" && (
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <p style={{ color: "#888", marginTop: "1rem" }}>Authorizing…</p>
        </div>
      )}

      {status === "approved" && approveResult && (
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>✓</p>
          <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Authorized!
          </p>
          <p style={{ color: "#ccc", marginBottom: "0.5rem" }}>
            {approveResult.client_name}
          </p>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            You can close this tab and return to the community app.
          </p>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>{message}</p>
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