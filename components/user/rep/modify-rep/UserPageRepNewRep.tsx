import { useState } from "react";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "./UserPageRepModifyModal";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";

export default function UserPageRepNewRep({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [isAddNewRepModalOpen, setIsAddNewRepModalOpen] =
    useState<boolean>(false);

  const [repToAdd, setRepToAdd] = useState<string>("");

  const onRepSearch = (repSearch: string) => {
    setRepToAdd(repSearch);
    setIsAddNewRepModalOpen(true);
  };

  return (
    <>
      <UserPageRepNewRepSearch onRepSearch={onRepSearch} />
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isAddNewRepModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageRepModifyModal
              profile={profile}
              repName={repToAdd}
              onClose={() => setIsAddNewRepModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
