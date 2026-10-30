import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import { useState, type ReactNode } from "react";

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
  // The first click can still be loading the wallet connection services.
  const [isOpening, setIsOpening] = useState(false);

  const onConnect = async (): Promise<void> => {
    setIsOpening(true);
    try {
      await seizeConnectFresh();
    } catch (error) {
      const message = "Failed to open wallet connection. Please try again.";
      console.error(message, error);
      setToast({ message, type: "error" });
    } finally {
      setIsOpening(false);
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
      loading={isOpening}
      className={className}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
