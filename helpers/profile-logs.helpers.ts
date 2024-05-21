import { ProfileActivityLogType } from "../entities/IProfile";

const DISABLED_LOG_TYPES = [
  ProfileActivityLogType.DROP_COMMENT,
  ProfileActivityLogType.DROP_RATING_EDIT,
  ProfileActivityLogType.DROP_CREATED,
];
export const getProfileLogTypes = ({
  logTypes,
  addDisabledLogTypes = [],
}: {
  readonly logTypes: ProfileActivityLogType[];
  readonly addDisabledLogTypes?: ProfileActivityLogType[];
}): ProfileActivityLogType[] => {
  const disabledTypes = DISABLED_LOG_TYPES.filter(
    (logType) => !addDisabledLogTypes.includes(logType)
  );
  return logTypes.length
    ? logTypes
    : Object.values(ProfileActivityLogType).filter(
        (logType) => !disabledTypes.includes(logType)
      );
};
