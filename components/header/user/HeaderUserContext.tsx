import Link from "next/link";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import HeaderUserProfile from "./HeaderUserProfile";
import HeaderUserProxy from "./proxy/HeaderUserProxy";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

export default function HeaderUserContext({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { address } = useSeizeConnectContext();
  const haveProfile = !!profile.profile?.handle;
  return (
    <div className="tailwind-scope">
      <div className="tw:flex tw:space-x-4 tw:lg:mr-3">
        <div
          className="tw:relative tw:inline-flex tw:rounded-lg tw:shadow-sm"
          role="group">
          <HeaderUserProfile profile={profile} />
          <HeaderUserProxy profile={profile} />
        </div>
        {!haveProfile && (
          <Link
            href={`/${address}/identity`}
            className="tw:ml-4 tw:sm:ml-3 tw:no-underline tw:whitespace-nowrap tw:inline-flex tw:items-center tw:cursor-pointer tw:bg-primary-500 tw:px-3.5 tw:py-2.5 tw:text-sm tw:leading-6 tw:rounded-lg tw:font-semibold tw:text-white tw:hover:text-white tw:border-0 tw:ring-1 tw:ring-inset tw:ring-primary-500 tw:hover:ring-primary-600 tw:placeholder:text-iron-300 tw:focus:outline-none tw:focus:ring-1 tw:focus:ring-inset tw:shadow-sm tw:hover:bg-primary-600 tw:transition tw:duration-300 tw:ease-out">
            Create profile
          </Link>
        )}
      </div>
    </div>
  );
}
