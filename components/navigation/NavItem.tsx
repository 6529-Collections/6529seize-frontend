import Image from "next/image";
import { useRouter } from "next/router";
import { useViewContext } from "./ViewContext";
import type { NavItem as NavItemData } from "./navTypes";

interface Props {
  readonly item: NavItemData;
}

const NavItem = ({ item }: Props) => {
  const router = useRouter();
  const { activeView, setActiveView } = useViewContext();

  const { name } = item;
  const Icon = "Icon" in item ? item.Icon : undefined;
  const image = "image" in item ? item.image : undefined;

  let isActive = false;
  const handleClick = () => {
    if (item.kind === "route") {
      router.push(item.href);
      setActiveView(null);
    } else {
      setActiveView(item.viewKey);
    }
  };

  if (item.kind === "route") {
    isActive = router.pathname === item.href;
  } else {
    isActive = activeView === item.viewKey;
  }

  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      className="tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors tw-size-12"
    >
      {image ? (
        <div className="tw-flex tw-items-center tw-justify-center -tw-translate-y-2">
          <Image
            src={image}
            alt={name}
            width={24}
            height={24}
            className={`tw-object-contain ${name === "Waves" ? "tw-size-6" : "tw-size-8"} tw-shadow-lg ${isActive ? "tw-opacity-100" : "tw-opacity-50"}`}
          />
        </div>
      ) : Icon ? (
        <Icon className={`tw-size-6 ${isActive ? "tw-text-white" : "tw-text-iron-400"}`} />
      ) : null}
    </button>
  );
};

export default NavItem; 