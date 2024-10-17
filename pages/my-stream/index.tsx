import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import MyStreamLayout from "../../components/brain/my-stream/layout/MyStreamLayout";
import MyStreamWrapper from "../../components/brain/my-stream/MyStreamWrapper";
import { getCommonHeaders } from "../../helpers/server.helpers";
import {
  dehydrate,
  QueryClient,
  DehydratedState,
  HydrationBoundary,
} from "@tanstack/react-query";
import { prefetchWavesOverview } from "../../helpers/stream.helpers";
import { GetServerSidePropsContext } from "next";

interface Props {
  dehydratedState: DehydratedState;
}

const Page: NextPageWithLayout<{ pageProps: Props }> = ({ pageProps }) => (
  <HydrationBoundary state={pageProps.dehydratedState}>
    <div className="tailwind-scope">
      <MyStreamWrapper />
    </div>
  </HydrationBoundary>
);
Page.getLayout = (page: ReactElement) => (
  <MyStreamLayout>{page}</MyStreamLayout>
);

export default Page;
export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<{
  props: Props;
}> {
  const queryClient = new QueryClient();
  const headers = getCommonHeaders(context);
  const waveId = context.query.wave as string | undefined ?? null;
  await prefetchWavesOverview({ queryClient, headers, waveId });
  return { props: { dehydratedState: dehydrate(queryClient) } };
}
