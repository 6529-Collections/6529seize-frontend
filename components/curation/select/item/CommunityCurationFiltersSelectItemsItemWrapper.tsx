import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveCurationFilterId,
  setActiveCurationFilterId,
} from "../../../../store/curationFilterSlice";
import { CurationFilterResponse } from "../../../../helpers/filters/Filters.types";
import { AuthContext } from "../../../auth/Auth";
import { motion } from "framer-motion";

export default function CommunityCurationFiltersSelectItemsItemWrapper({
  filter,
  children,
  onEditClick,
}: {
  readonly filter: CurationFilterResponse;
  readonly children: React.ReactNode;
  readonly onEditClick: (filter: CurationFilterResponse) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const [isActive, setIsActive] = useState(
    activeCurationFilterId && activeCurationFilterId === filter.id
  );

  useEffect(() => {
    setIsActive(
      activeCurationFilterId &&
        activeCurationFilterId.toLocaleLowerCase() === filter.id.toLowerCase()
    );
  }, [activeCurationFilterId]);

  const dispatch = useDispatch();

  const [haveProfile, setHaveProfile] = useState(
    !!connectedProfile?.profile?.handle
  );
  useEffect(
    () => setHaveProfile(!!connectedProfile?.profile?.handle),
    [connectedProfile]
  );

  const onFilterClick = () => {
    if (isActive && haveProfile) {
      onEditClick(filter);
    } else {
      dispatch(setActiveCurationFilterId(filter.id));
    }
  };

  const getClasses = (): string => {
    let response = "";
    if (isActive) {
      response += "tw-border-primary-300";
      if (haveProfile) {
        response += " tw-cursor-pointer";
      }
    } else {
      response += " tw-cursor-pointer";
    }

    return response;
  };

  const [classes, setClasses] = useState(getClasses());

  useEffect(() => {
    setClasses(getClasses());
  }, [isActive, haveProfile]);

  return (
    <motion.div
      layout
      initial={{ height: "auto", opacity: 1 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onFilterClick}
      className={` tw-bg-iron-950 tw-rounded-lg tw-w-full tw-text-left tw-border tw-border-solid tw-border-iron-700 tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700 hover:tw-border-primary-300 tw-transition tw-duration-300 tw-ease-out  ${classes}`}
    >
      {children}
    </motion.div>
  );
}
