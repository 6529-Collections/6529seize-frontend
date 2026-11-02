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
        <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 tw-p-5 sm:tw-p-6">
          <div className="tw-hidden" />
          <h3 className="tw-m-0 tw-mb-6 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-100 md:tw-text-xl">
            Create New Grant
          </h3>
          <UserPageXtdhGrant />
        </section>
      )}
    </div>
  );
}
