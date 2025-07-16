import "@/styles/seize-bootstrap.scss";
import "@/styles/globals.scss";
import "@/styles/swiper.scss";
import "@/components/drops/create/lexical/lexical.styles.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import type { AppProps } from "next/app";

import { NextPage, NextPageContext } from "next";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Providers from "@/components/providers/Providers";
import { getPageMetadata } from "@/components/providers/metadata";
import { wrapper } from "@/store/store";
import { Provider } from "react-redux";
import BaseLayout from "@/components/layout/BaseLayout";
import Router from "next/router";
import { initDeepLink } from "@/helpers/deep-link.helpers";

export type NextPageWithLayout<Props> = NextPage<Props> & {
  getLayout?: (page: ReactElement<any>) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout<NextPageContext>;
};

export default function App({ Component, ...rest }: AppPropsWithLayout) {
  const [ready, setReady] = useState(false);

  const { store, props } = wrapper.useWrappedStore(rest);

  const pageMetadata = rest.pageProps.metadata;
  const componentMetadata = (Component as any).metadata;

  const getLayout = Component.getLayout ?? ((page) => page);

  const metadata = getPageMetadata({
    componentMetadata,
    pageMetadata,
  });

  useEffect(() => {
    async function startup() {
      await initDeepLink(Router);
      setReady(true);
    }
    startup();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <Provider store={store}>
      <BaseLayout metadata={metadata}>
        <Providers>
          <MainLayout>
            {getLayout(<Component {...rest.pageProps} {...props.pageProps} />)}
          </MainLayout>
        </Providers>
      </BaseLayout>
    </Provider>
  );
}
