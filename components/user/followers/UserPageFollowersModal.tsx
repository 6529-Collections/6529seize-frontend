import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import useFollowersList from "@/hooks/useFollowersList";

export default function UserPageFollowersModal({
  profileId,
  isOpen,
  onClose,
}: {
  readonly profileId: string | null | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const { followers, isFetching, onBottomIntersection } = useFollowersList({
    profileId,
    enabled: isOpen,
  });

  return (
    <MobileWrapperDialog
      title="Followers"
      isOpen={isOpen}
      onClose={onClose}
      tall
      fixedHeight
      tabletModal
      showScrollbar
    >
      <div className="tw-px-4 sm:tw-px-6">
        <FollowersListWrapper
          followers={followers}
          loading={isFetching}
          onBottomIntersection={onBottomIntersection}
        />
      </div>
    </MobileWrapperDialog>
  );
}
