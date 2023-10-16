import UserSettingsPfp from "./UserSettingsPfp";

interface Props {
  user: string;
  wallets: string[];
}
export default function UserSettingsComponent(props: Props) {
  return <UserSettingsPfp user={props.user} wallets={props.wallets} />;
}
