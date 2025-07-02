import React, { ReactNode } from "react";
import Head from "next/head";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import { useTitle } from "@/contexts/TitleContext";
import ClientOnly from "@/components/client-only/ClientOnly";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { title: pageTitle } = useTitle();

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <ClientOnly>
        <LayoutWrapper>{children}</LayoutWrapper>
      </ClientOnly>
    </>
  );
};

export default MainLayout;
