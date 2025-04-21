import useIsMobileDevice from "../../../hooks/isMobileDevice";
import useCapacitor from "../../../hooks/useCapacitor";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";

export default function HeaderOpenMobile() {
  const capacitor = useCapacitor();
  const isMobileDevice = useIsMobileDevice();

  const router = useRouter();

  const openInApp = () => {
    let routerPath = router.asPath;
    if (routerPath.endsWith("/")) {
      routerPath = routerPath.slice(0, -1);
    }

    const encodedPath = encodeURIComponent(routerPath);
    const launchUrl = `${window.location.origin}/open-mobile?path=${encodedPath}`;

    window.open(launchUrl, "_blank");
  };

  if (capacitor.isCapacitor || !isMobileDevice) {
    return null;
  }

  return (
    <div className="tailwind-scope tw:relative min-[1200px]:tw:mr-3 tw:self-center">
      <button
        onClick={openInApp}
        aria-label="Open in Mobile"
        title="Open in Mobile"
        className="tw:relative tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:bg-iron-800 tw:h-10 tw:w-10 tw:border tw:border-solid tw:border-iron-700 tw:text-iron-300 tw:hover:text-iron-50 tw:shadow-sm tw:hover:bg-iron-700 tw:focus-visible:outline tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-primary-400 tw:transition tw:duration-300 tw:ease-out">
        <FontAwesomeIcon
          icon={faMobileScreenButton}
          className="tw:size-4 tw:shrink-0"
        />
      </button>
    </div>
  );
}
