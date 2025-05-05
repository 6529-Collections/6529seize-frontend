import { useRouter } from "next/router";
import useDeviceInfo from "./hooks/useDeviceInfo";
import Footer from "./components/footer/Footer";

export default function FooterWrapper() {
  const { isApp } = useDeviceInfo();
  const router = useRouter();
  const hideFooter =
    isApp ||
    ["/waves", "/my-stream", "/open-mobile"].some((path) =>
      router.pathname.startsWith(path)
    );
  return hideFooter ? null : <Footer />;
} 