import { GROUP_CREATE_CONTROL_SCOPE_STYLES } from "./GroupCreate.styles";

export default function GroupCreateWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className={`tailwind-scope tw-relative tw-mt-4 lg:tw-mt-6 ${GROUP_CREATE_CONTROL_SCOPE_STYLES}`}
    >
      <div>{children}</div>
    </div>
  );
}
