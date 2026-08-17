"use client";

import { useState } from "react";
import UserPageIdentityAddStatements from "./UserPageIdentityAddStatements";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import Button from "@/components/utils/button/Button";
import type { ButtonSize } from "@/components/utils/button/buttonStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function UserPageIdentityStatementsAddButton({
  profile,
  size,
}: {
  readonly profile: ApiIdentity;
  readonly size?: ButtonSize;
}) {
  const locale = useBrowserLocale();
  const [isAddStatementsOpen, setIsAddStatementsOpen] =
    useState<boolean>(false);

  return (
    <div>
      <Button
        size={size}
        aria-haspopup="dialog"
        aria-expanded={isAddStatementsOpen}
        onClick={() => setIsAddStatementsOpen(true)}
      >
        <svg
          className="-tw-ml-1 tw-h-5 tw-w-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          {t(locale, "user.profile.identity.statements.add.triggerLabel")}
        </span>
      </Button>

      <UserPageIdentityAddStatements
        profile={profile}
        isOpen={isAddStatementsOpen}
        onClose={() => setIsAddStatementsOpen(false)}
      />
    </div>
  );
}
