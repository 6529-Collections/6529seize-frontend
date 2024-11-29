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
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { Time } from "../../helpers/time";

interface Props {
  dehydratedState: DehydratedState;
}

const Page: NextPageWithLayout<{ pageProps: Props }> = ({ pageProps }) => (
  <HydrationBoundary state={pageProps.dehydratedState}>
    <MyStreamWrapper />
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
  const feedItemsFetched =
    context?.req.cookies[[QueryKey.FEED_ITEMS].toString()];


  if (feedItemsFetched && +feedItemsFetched < Time.now().toMillis() - 60000) {
    const waveId = (context.query.wave as string | undefined) ?? null;
    await prefetchWavesOverview({ queryClient, headers, waveId });
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
}
