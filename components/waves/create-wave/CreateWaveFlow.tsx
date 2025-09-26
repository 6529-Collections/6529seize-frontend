import useIsMobileScreen from "../../../hooks/isMobileScreen";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: React.ReactNode;
}) {
  const isMobile = useIsMobileScreen();

  return (
    <div className="tailwind-scope tw-bg-iron-950">
      <div className="tw-h-full tw-w-full">
       
          {children}
      
      </div>
    </div>
  );
}
