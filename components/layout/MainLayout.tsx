import React, { ReactNode } from "react";
import { useRouter } from "next/router";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import ClientOnly from "../client-only/ClientOnly";
import Head from "next/head";
import { PageSSRMetadata } from "../../helpers/Types";
import { useAuth } from "../auth/Auth";
import LayoutWrapper from "../providers/LayoutWrapper";

interface MainLayoutProps {
  children: ReactNode;
  metadata: PageSSRMetadata;
}

const MainLayout = ({ children, metadata }: MainLayoutProps) => {
  const router = useRouter();

  const { title: pageTitle } = useAuth();
  const { title: metadataTitle, description, ogImage, twitterCard } = metadata;

  const ogUrl = `${process.env.BASE_ENDPOINT}${router.asPath}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={description} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content={metadataTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content={twitterCard} />
      </Head>
      <ClientOnly>
        <LayoutWrapper>{children}</LayoutWrapper>
      </ClientOnly>
    </>
  );
};

export default MainLayout;
