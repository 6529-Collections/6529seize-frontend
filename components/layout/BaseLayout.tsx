import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Head from "next/head";
import { PageSSRMetadata } from "../../helpers/Types";

interface BaseLayoutProps {
  children: ReactNode;
  metadata: PageSSRMetadata;
}

const BaseLayout = ({ children, metadata }: BaseLayoutProps) => {
  const pathname = usePathname();

  const { title: metadataTitle, description, ogImage, twitterCard } = metadata;

  const ogUrl = `${process.env.BASE_ENDPOINT}${pathname}`;

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={description} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content={metadataTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content={twitterCard} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      {children}
    </>
  );
};

export default BaseLayout;
