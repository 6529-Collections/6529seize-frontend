import type { AppProps } from "next/app";
import Providers from "@/components/providers/Providers";
import MainLayout from "@/components/layout/MainLayout";
import { getPageMetadata } from "@/components/providers/metadata";

export default function App({ Component, pageProps }: AppProps) {
  const metadata = getPageMetadata({
    componentMetadata: (Component as any).metadata,
    pageMetadata: pageProps?.metadata,
  });

  const getLayout =
    (Component as any).getLayout ?? ((page: React.ReactNode) => page);

  return (
    <Providers>
      <MainLayout metadata={metadata}>
        {getLayout(<Component {...pageProps} />)}
      </MainLayout>
    </Providers>
  );
}
