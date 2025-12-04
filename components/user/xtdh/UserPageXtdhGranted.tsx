"use client";

import UserPageXtdhGrant from "./UserPageXtdhGrant";
import UserPageXtdhGrantedList from "./UserPageXtdhGrantedList";

export default function UserPageXtdhGranted({
  canGrant,
  grantor,
  isSelf,
}: {
  readonly canGrant: boolean;
  readonly grantor: string;
  readonly isSelf: boolean;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-8">
      <UserPageXtdhGrantedList grantor={grantor} isSelf={isSelf} />

      {canGrant && (
        <section className="tw-flex tw-flex-col tw-gap-4 tw-mt-6 tw-pt-6 tw-border-t tw-border-iron-700">
          <header className="tw-pl-4 tw-pr-4 lg:tw-pl-6 lg:tw-pr-6">
            <h2 className="tw-text-xl tw-font-bold tw-text-iron-100 tw-m-0">
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
