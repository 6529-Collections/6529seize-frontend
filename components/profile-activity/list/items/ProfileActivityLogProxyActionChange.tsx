import { ProfileActivityLogProxyActionChanged } from "../../../../entities/IProfile";

export default function ProfileActivityLogProxyActionChange({
  log,
}: {
  readonly log: ProfileActivityLogProxyActionChanged;
}) {
  console.log(log);
  // TODO: Implement ProfileActivityLogProxyActionChange
  return <></>;
}
