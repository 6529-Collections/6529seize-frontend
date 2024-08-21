import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";

export default function DropListItemContentWrapper({
  shouldWrap,
  children,
  scrollIntoView,
}: {
  readonly shouldWrap: boolean;
  readonly children: React.ReactNode;
  readonly scrollIntoView: () => void;
}) {
  if (shouldWrap) {
    return (
      <CommonAnimationHeight onAnimationCompleted={scrollIntoView}>
        {children}
      </CommonAnimationHeight>
    );
  }
  return <>{children}</>;
}
