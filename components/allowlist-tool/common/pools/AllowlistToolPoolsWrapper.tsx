import AllowlistToolAnimationOpacity from "../animation/AllowlistToolAnimationOpacity";
import AllowlistToolAnimationWrapper from "../animation/AllowlistToolAnimationWrapper";
import AllowlistToolPoolsLoading from "../animation/AllowlistToolPoolsLoading";

export default function AllowlistToolPoolsWrapper({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <AllowlistToolAnimationWrapper mode="wait" initial={true}>
      {isLoading ? (
        <AllowlistToolAnimationOpacity key="loading">
          <AllowlistToolPoolsLoading />
        </AllowlistToolAnimationOpacity>
      ) : (
        <AllowlistToolAnimationOpacity key="table">
          {children}
        </AllowlistToolAnimationOpacity>
      )}
    </AllowlistToolAnimationWrapper>
  );
}
