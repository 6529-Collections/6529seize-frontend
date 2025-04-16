import { useEffect } from "react";
import { useRouter } from "next/router";
import { ShareMobileApp } from "../components/header/share/HeaderShareMobileApps";

const OpenMobilePage = () => {
  const router = useRouter();
  const { path = "/" } = router.query;

  useEffect(() => {
    if (typeof window === "undefined" || !path) return;

    const appScheme = process.env.MOBILE_APP_SCHEME ?? "mobile6529";
    const decodedPath = decodeURIComponent(
      Array.isArray(path) ? path[0] : path
    );
    const deepLink = `${appScheme}://navigate${decodedPath}`;

    window.location.href = deepLink;
  }, [path]);

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-screen tw-text-center tw-p-4 tw-gap-10">
      <p className="tw-text-2xl tw-font-bold tw-animate-pulse">
        Opening 6529 Mobile...
      </p>
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1">
        <p className="tw-text-xl tw-font-bold">Get 6529 Mobile</p>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-4">
          <ShareMobileApp platform="ios" target="_self" />
          <ShareMobileApp platform="android" target="_self" />
        </div>
      </div>
      <a href="https://6529.io" className="tw-mt-10">
        Go to 6529.io
      </a>
    </div>
  );
};

export default OpenMobilePage;
