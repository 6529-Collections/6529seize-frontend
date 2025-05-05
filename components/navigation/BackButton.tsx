import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigationHistoryContext } from "../../contexts/NavigationHistoryContext";
import { useRouter } from "next/router";

export default function BackButton() {
  const { canGoBack, goBack } = useNavigationHistoryContext();
  const router = useRouter();
  const waveId = typeof router.query.wave === "string" ? router.query.wave : null;

  if (!waveId) return null;

  const handleClick = () => {
    if (waveId) {
      router.replace(`/my-stream?wave=${waveId}&view=waves`, undefined, { shallow: true });
    } else if (canGoBack) {
      goBack();
    }
  };

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={handleClick}
      className="tw-flex tw-items-center tw-justify-center tw-h-10 tw-w-10 tw-bg-transparent tw-border-none"
    >
      <ArrowLeftIcon className="tw-size-6 tw-flex-shrink-0 tw-text-iron-50" />
    </button>
  );
} 