"use client";

import UserPageXtdhGrant from "./UserPageXtdhGrant";
import UserPageXtdhGrantedList from "./UserPageXtdhGrantedList";

export default function UserPageXtdhGranted({
  canGrant,
}: {
  readonly canGrant: boolean;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-8">
      <UserPageXtdhGrantedList />

      {canGrant && (
        <section className="tw-flex tw-flex-col tw-gap-4 tw-pt-6 tw-border-t tw-border-iron-800">
          <header>
            <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
              Create New Grant
            </h2>
          </header>
          <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-space-y-4">
            <UserPageXtdhGrant />
          </div>
        </section>
      )}
    </div>
  );
}
