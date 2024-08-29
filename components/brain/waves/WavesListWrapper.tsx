import FollowingWaves from "./FollowingWaves";
import MyWaves from "./MyWaves";
import PopularWaves from "./PopularWaves";

export enum WavesListType {
  MY_WAVES = "MY_WAVES",
  FOLLOWING = "FOLLOWING",
  POPULAR = "POPULAR",
}

export default function WavesListWrapper({ type }: { readonly type: WavesListType }) {

  const components: Record<WavesListType, JSX.Element> = {
    [WavesListType.MY_WAVES]: <MyWaves />,
    [WavesListType.FOLLOWING]: <FollowingWaves/>,
    [WavesListType.POPULAR]: <PopularWaves/>,
  };

  return components[type];
}
