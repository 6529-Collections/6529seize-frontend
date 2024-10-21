import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import MyStreamLayout from "../../components/brain/my-stream/layout/MyStreamLayout";
import Notifications from "../../components/brain/notifications/Notifications";
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { GetServerSidePropsContext } from "next";
import { getCommonHeaders } from "../../helpers/server.helpers";
import { prefetchAuthenticatedNotifications } from "../../helpers/stream.helpers";

interface Props {
  dehydratedState: DehydratedState;
}

const Page: NextPageWithLayout<{ pageProps: Props }> = ({ pageProps }) => (
  <HydrationBoundary state={pageProps.dehydratedState}>
    <div className="tailwind-scope">
      <Notifications />
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
  await prefetchAuthenticatedNotifications({ queryClient, headers });
  return { props: { dehydratedState: dehydrate(queryClient) } };
}
