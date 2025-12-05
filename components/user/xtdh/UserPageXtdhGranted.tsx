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
        <section className="tw-bg-iron-950/60 tw-border tw-border-solid tw-border-white/5 tw-rounded-xl tw-p-6 tw-relative">
          <div className="tw-absolute tw-top-0 tw-right-0 tw-w-64 tw-h-64 tw-bg-primary-600/5 tw-rounded-full tw-blur-3xl tw-pointer-events-none" />
          <h3 className="tw-text-white tw-text-lg tw-font-semibold tw-mb-6 tw-flex tw-items-center tw-gap-2 tw-m-0">
            Create New Grant
          </h3>
          <UserPageXtdhGrant />
        </section>
      )}
    </div>
  );
}
