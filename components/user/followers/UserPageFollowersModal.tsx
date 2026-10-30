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
  const { followers, isFetching, isEmpty, onBottomIntersection } =
    useFollowersList({
      profileId,
      enabled: isOpen,
    });

  return (
    <MobileWrapperDialog
      title={getFollowersMessage("followers.modal.title")}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      surfaceClassName="[--mobile-wrapper-dialog-resting-height:32rem] tw-bg-iron-950"
      showScrollbar
    >
      <div className="tw-min-h-48">
        <FollowersListWrapper
          followers={followers}
          loading={isFetching}
          onBottomIntersection={onBottomIntersection}
          showFollowButtons
        />
        {isEmpty && (
          <p className="tw-p-4 tw-text-center tw-text-iron-400">
            {getFollowersMessage("followers.list.empty")}
          </p>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
