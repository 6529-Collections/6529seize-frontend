"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import type { ButtonVariant } from "@/components/utils/button/buttonStyles";
import { getEncryptedDevicesRoute } from "@/helpers/navigation.helpers";
import { requestE2eeBackupSetup } from "./backupSetupRequest";

/**
 * Opens Devices & security and asks its backup card to start setup (or
 * restore). The request is made before navigating, so the card takes it
 * when it mounts, or at once if it is already on the page.
 */
export function BackupSetupLink({
  variant = "action",
  onNavigate,
  children,
}: {
  readonly variant?: ButtonVariant;
  /** For example, closing the dialog the link is in. */
  readonly onNavigate?: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={getEncryptedDevicesRoute()}
      onClick={() => {
        requestE2eeBackupSetup();
        onNavigate?.();
      }}
      className={getButtonClasses({ variant, size: "sm" })}
    >
      {children}
    </Link>
  );
}
