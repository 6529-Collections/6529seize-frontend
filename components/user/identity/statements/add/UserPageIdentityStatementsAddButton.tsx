"use client";

import { useEffect, useState } from "react";
import UserPageIdentityAddStatements from "./UserPageIdentityAddStatements";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import Button from "@/components/utils/button/Button";

export default function UserPageIdentityStatementsAddButton({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [isAddStatementsOpen, setIsAddStatementsOpen] =
    useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div>
      <Button onClick={() => setIsAddStatementsOpen(!isAddStatementsOpen)}>
        <svg
          className="tw-h-5 tw-w-5 -tw-ml-1"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Add</span>
      </Button>

      {isMounted && isAddStatementsOpen && (
        <UserPageIdentityAddStatements
          profile={profile}
          onClose={() => setIsAddStatementsOpen(false)}
        />
      )}
    </div>
  );
}
