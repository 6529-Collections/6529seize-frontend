import {
  getPushLogoutFailure,
  getPushPreparationFailureReason,
  PushInstallationPreparationError,
} from "@/services/notifications/push-installation-errors";

it("classifies only the exact observed native-session rejection for recovery", () => {
  const message =
    "A native session is required for logout before push registration";
  expect(
    getPushLogoutFailure(Object.assign(new Error(message), { status: 403 }))
  ).toEqual({ reason: "native_session_required", http_status: 403 });
  expect(
    getPushLogoutFailure(Object.assign(new Error(message), { status: 500 }))
  ).toEqual({ reason: "http_failure", http_status: 500 });
  expect(
    getPushLogoutFailure(
      Object.assign(new Error(message + " private"), { status: 403 })
    )
  ).toEqual({ reason: "http_failure", http_status: 403 });
});

it("does not expose rejected response bodies, credentials, or storage messages", () => {
  const secret = "private-proof-and-wallet-data";
  const error = Object.assign(new Error(secret), {
    status: 403,
    response: { body: { error: secret, native_refresh_token: secret } },
  });
  expect(getPushLogoutFailure(error)).toEqual({
    reason: "http_failure",
    http_status: 403,
  });
  expect(getPushPreparationFailureReason(error)).toBe(
    "storage_or_identity_failure"
  );
  expect(
    getPushPreparationFailureReason(
      new PushInstallationPreparationError("logout_pending")
    )
  ).toBe("logout_pending");
});

it.each([
  null,
  undefined,
  "private storage contents",
  42,
  true,
  { reason: "forged" },
])("safely classifies non-Error preparation failure %#", (failure) => {
  expect(getPushPreparationFailureReason(failure)).toBe(
    "storage_or_identity_failure"
  );
});

it.each(["logout_pending", "installation_changed", "auth_changed"] as const)(
  "preserves the diagnostic reason %s while sharing the safe message",
  (reason) => {
    const error = new PushInstallationPreparationError(reason);
    expect(getPushPreparationFailureReason(error)).toBe(reason);
    expect(error.message).toBe(
      "Push registration deferred until logout reconciliation completes"
    );
  }
);
