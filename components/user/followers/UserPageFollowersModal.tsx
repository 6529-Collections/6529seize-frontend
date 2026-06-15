import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import { getFollowersMessage } from "@/components/utils/followers/followers.messages";
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
      title={getFollowersMessage("followers.modal.title")}
      isOpen={isOpen}
      onClose={onClose}
      tall
      fixedHeight
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      showScrollbar
    >
      <div>
        <FollowersListWrapper
          followers={followers}
          loading={isFetching}
          onBottomIntersection={onBottomIntersection}
          showFollowButtons
        />
      </div>
    </MobileWrapperDialog>
  );
}
