import type { CicStatement } from "@/entities/IProfile";
import UserPageHeaderAboutStatement from "./UserPageHeaderAboutStatement";

export default function UserPageHeaderAbout({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  if (!statement) return null;

  return (
    <div id="profile-about" className="tw-scroll-mt-24">
      <div className="tw-max-w-2xl">
        <UserPageHeaderAboutStatement statement={statement} />
      </div>
    </div>
  );
}
