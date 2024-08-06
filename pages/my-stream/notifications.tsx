import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import MyStreamLayout from "../../components/brain/my-stream/layout/MyStreamLayout";
import Notifications from "../../components/brain/notifications/Notifications";

const Page: NextPageWithLayout<{}> = () => (
  <div className="tailwind-scope">
    <Notifications />
  </div>
);
Page.getLayout = (page: ReactElement) => (
  <MyStreamLayout>{page}</MyStreamLayout>
);

export default Page;
