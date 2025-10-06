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
        <section className="tw-flex tw-flex-col tw-gap-4 tw-mt-6 tw-pt-6 tw-border-t tw-border-iron-700">
          <header>
            <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
              Create New Grant
            </h2>
          </header>
          <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 lg:tw-p-6 tw-shadow-inner tw-shadow-black/30">
            <UserPageXtdhGrant />
          </div>
        </section>
      )}
    </div>
  );
}
