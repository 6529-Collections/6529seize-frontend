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
      {canGrant && (
        <section className="tw-flex tw-flex-col tw-gap-4">
          <header>
            <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
              Grant xTDH
            </h2>
          </header>
          <UserPageXtdhGrant />
        </section>
      )}

      <section className="tw-flex tw-flex-col tw-gap-4">
        <header>
          <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
            Granted xTDH
          </h2>
        </header>
        <UserPageXtdhGrantedList />
      </section>
    </div>
  );
}
