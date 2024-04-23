import { ProxyMode } from "../UserPageProxy";

export default function ProxyList({
  onModeChange,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  return (
    <div>
      <button onClick={() => onModeChange(ProxyMode.CREATE)}>CREATE</button>
    </div>
  );
}
