import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "../styles/swiper.scss";
import type { AppProps } from "next/app";

import { NextPage, NextPageContext } from "next";
import { ReactElement, ReactNode } from "react";
import "../components/drops/create/lexical/lexical.styles.scss";
import MainLayout from "../components/layout/MainLayout";
import Providers from "@/components/providers/Providers";
import { getPageMetadata } from "@/components/providers/metadata";

export type NextPageWithLayout<Props> = NextPage<Props> & {
  getLayout?: (page: ReactElement<any>) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout<NextPageContext>;
};

export default function App({ Component, ...rest }: AppPropsWithLayout) {
  const pageMetadata = rest.pageProps.metadata;
  const componentMetadata = (Component as any).metadata;

  const getLayout = Component.getLayout ?? ((page) => page);

  const metadata = getPageMetadata({
    componentMetadata,
    pageMetadata,
  });

  return (
    <Providers>
      <MainLayout metadata={metadata}>
        {getLayout(<Component {...rest.pageProps} />)}
      </MainLayout>
    </Providers>
  );
}
