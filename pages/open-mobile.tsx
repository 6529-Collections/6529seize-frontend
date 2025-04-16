import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ShareMobileApp } from "../components/header/share/HeaderShareMobileApps";
import useCapacitor from "../hooks/useCapacitor";

const OpenMobilePage = () => {
  const router = useRouter();
  const { path = "/" } = router.query;

  const capacitor = useCapacitor();

  const [decodedPath, setDecodedPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !path) return;

    const appScheme = process.env.MOBILE_APP_SCHEME ?? "mobile6529";
    const decoded = decodeURIComponent(Array.isArray(path) ? path[0] : path);
    const deepLink = `${appScheme}://navigate${decoded}`;
    setDecodedPath(decoded);

    window.location.href = deepLink;
  }, [path]);

  const handleBack = () => {
    window.location.href = `${window.location.origin}${decodedPath}`;
  };

  const printShareMobileApps = useMemo(() => {
    const shareIos = <ShareMobileApp platform="ios" target="_self" />;
    const shareAndroid = <ShareMobileApp platform="android" target="_self" />;

    if (capacitor.isIos) {
      return shareIos;
    } else if (capacitor.isAndroid) {
      return shareAndroid;
    }

    return (
      <>
        {shareIos}
        {shareAndroid}
      </>
    );
  }, [capacitor.isIos, capacitor.isAndroid]);

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-screen tw-text-center tw-p-4 tw-gap-10">
      <p className="tw-text-2xl tw-font-bold tw-animate-pulse">
        Opening 6529 Mobile...
      </p>
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1">
        <p className="tw-text-xl tw-font-bold">Get 6529 Mobile</p>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-4">
          {printShareMobileApps}
        </div>
      </div>
      <button onClick={handleBack} className="tw-mt-10 btn-link">
        Back to 6529.io
      </button>
    </div>
  );
};

export default OpenMobilePage;
