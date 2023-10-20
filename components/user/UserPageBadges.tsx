import UserPageBadge from "./UserPageBadge";
import UserPageBadgeAdd from "./UserPageBadgeAdd";

export default function UserPageBadges() {
  return (
    <div className="tw-gap-4 tw-flex tw-flex-wrap tw-items-center">
      <UserPageBadge count={1323} mycounts={100}>
        Digital Art
      </UserPageBadge>
      <UserPageBadge count={2} mycounts={0}>
        Graphic Designer
      </UserPageBadge>
      <UserPageBadge count={2} mycounts={0}>
        Graphic Designer
      </UserPageBadge>
      <UserPageBadgeAdd />
    </div>
  );
}
