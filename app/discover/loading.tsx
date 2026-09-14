import PrimaryRouteLoadingShell from "@/components/navigation/PrimaryRouteLoadingShell";

export default function Loading() {
  return (
    <PrimaryRouteLoadingShell
      messageKey="navigation.primary.loading.discovery"
      variant="cards"
    />
  );
}
