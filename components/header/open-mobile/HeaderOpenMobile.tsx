import useIsMobileDevice from "../../../hooks/isMobileDevice";
import useCapacitor from "../../../hooks/useCapacitor";
import { useRouter } from "next/router";

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

  if (
    capacitor.isCapacitor ||
    !isMobileDevice ||
    router.pathname.startsWith("/open-mobile")
  ) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-relative min-[1200px]:tw-mr-3 tw-self-center">
      <button
        onClick={openInApp}
        aria-label="Open Mobile"
        title="Open Mobile"
        className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out">
        <svg
          className="tw-w-5 tw-h-5 tw-flex-shrink-0"
          viewBox="0 0 1024 1024"
          strokeWidth="1.5"
          stroke="currentColor">
          <path
            d="M426.666667 736V597.333333H128v-170.666666h298.666667V288L650.666667 512 426.666667 736M341.333333 85.333333h384a85.333333 85.333333 0 0 1 85.333334 85.333334v682.666666a85.333333 85.333333 0 0 1-85.333334 85.333334H341.333333a85.333333 85.333333 0 0 1-85.333333-85.333334v-170.666666h85.333333v170.666666h384V170.666667H341.333333v170.666666H256V170.666667a85.333333 85.333333 0 0 1 85.333333-85.333334z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
