import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";

export default function UserPageIdentity({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader />
    </div>
  );
}
