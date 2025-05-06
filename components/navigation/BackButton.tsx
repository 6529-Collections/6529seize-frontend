import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigationHistoryContext } from "../../contexts/NavigationHistoryContext";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Spinner from "../utils/Spinner";

export default function BackButton() {
  const { canGoBack, goBack } = useNavigationHistoryContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stopLoading = () => setLoading(false);
    router.events.on("routeChangeComplete", stopLoading);
    router.events.on("routeChangeError", stopLoading);
    return () => {
      router.events.off("routeChangeComplete", stopLoading);
      router.events.off("routeChangeError", stopLoading);
    };
  }, [router.events]);

  const waveId =
    typeof router.query.wave === "string" ? router.query.wave : null;

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    if (waveId) {
      router.replace(`/my-stream?wave=${waveId}&view=waves`, undefined, {
        shallow: true,
      });
      return;
    }
    if (canGoBack) {
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
      {loading ? (
        <Spinner />
      ) : (
        <ArrowLeftIcon className="tw-size-6 tw-flex-shrink-0 tw-text-iron-50" />
      )}
    </button>
  );
}
