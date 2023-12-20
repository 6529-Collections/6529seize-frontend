import { useContext } from "react";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";

export interface UserPageRepProps {
  profile: IProfileAndConsolidations;
  title: string;
}

const Page: NextPageWithLayout<{ pageProps: UserPageRepProps }> = ({
  pageProps,
}) => {
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);

  return (
    <div className="tailwind-scope">
      <h1>Rep</h1>
    </div>
  );
};
