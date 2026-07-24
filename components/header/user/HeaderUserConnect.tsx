import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import type { ReactNode } from "react";

interface HeaderUserConnectProps {
  readonly className?: string | undefined;
  readonly icon?: ReactNode;
  readonly label?: string | undefined;
}

export default function HeaderUserConnect({
  className,
  icon,
  label = "Connect",
}: HeaderUserConnectProps) {
  const { seizeConnectFresh } = useSeizeConnectContext();
  const { setToast } = useAuth();

  const onConnect = async (): Promise<void> => {
    try {
      await seizeConnectFresh();
    } catch (error) {
      const message = "Failed to open wallet connection. Please try again.";
      console.error(message, error);
      setToast({ message, type: "error" });
    }
  };

  return (
    <Button
      onClick={() => {
        void onConnect();
      }}
      type="button"
      variant="primary"
      size="lg"
      className={className}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
