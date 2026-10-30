import { AboutSection } from "@/types/enums";

const FOOTER_LINK_CLASSES =
  "tw-whitespace-nowrap tw-rounded-sm tw-py-2 tw-text-xs tw-font-medium tw-no-underline tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-text-iron-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-iron-200 motion-reduce:tw-transition-none";
const FOOTER_ROW_CLASSES =
  "tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-5 tw-gap-y-0 tw-px-6 md:tw-gap-x-6 md:tw-gap-y-2 md:tw-px-0";

export default function Footer({
  homeGallery = false,
}: {
  readonly homeGallery?: boolean;
}) {
  const linkClassName = `${FOOTER_LINK_CLASSES} ${homeGallery ? "tw-text-iron-400" : "tw-text-iron-500"}`;
  function printLink(href: string, text: string, newTab: boolean = false) {
    const target = newTab ? "_blank" : "_self";
    return (
      <a
        className={linkClassName}
        href={href}
        target={target}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {text}
      </a>
    );
  }

  function printLinkWithImage(
    href: string,
    img: string,
    text: string,
    newTab: boolean = true
  ) {
    const target = newTab ? "_blank" : "_self";
    return (
      <a
        className={linkClassName}
        href={href}
        target={target}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {/* Lazy keeps below-the-fold footer icons out of the server's preload hints. */}
        <img
          width="0"
          height="0"
          className="tw-h-[18px] tw-w-auto tw-align-middle tw-opacity-70 min-[801px]:tw-align-bottom"
          src={img}
          alt={text}
          loading="lazy"
        />{" "}
        {text}
      </a>
    );
  }

  return (
    <footer
      className={`${homeGallery ? "tw-gap-y-3 tw-px-4 md:tw-px-8" : "tw-gap-2 tw-px-8"} tailwind-scope tw-flex tw-flex-col tw-items-center tw-justify-center tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-900 tw-bg-black tw-pb-[calc(1.5rem+env(safe-area-inset-bottom))] tw-pt-8 tw-text-sm tw-leading-[18px] md:tw-pb-8`}
      id="footer"
    >
      <span className={FOOTER_ROW_CLASSES}>
        {printLinkWithImage(
          "https://x.com/punk6529",
          "/twitter.png",
          "@punk6529"
        )}
        {printLinkWithImage(
          "https://x.com/6529Collections",
          "/twitter.png",
          "@6529Collections"
        )}
        {printLinkWithImage(
          "https://github.com/6529-Collections",
          "/github_w.png",
          "6529-Collections"
        )}
      </span>
      <span className={FOOTER_ROW_CLASSES}>
        {printLink(
          `/about/${AboutSection.TERMS_OF_SERVICE}`,
          "Terms of Service"
        )}
        {printLink(`/about/${AboutSection.PRIVACY_POLICY}`, "Privacy Policy")}
        {printLink(`/about/${AboutSection.COPYRIGHT}`, "Copyright")}
        {printLink(`/about/${AboutSection.COOKIE_POLICY}`, "Cookie Policy")}
        {printLink(`/about/${AboutSection.LICENSE}`, "License")}
        {printLink("/about/6529-apps", "6529 Apps")}
        {printLink(`/tools/api`, "API")}
        {printLink(`/about/${AboutSection.CONTACT_US}`, "Contact Us")}
        {printLink("https://status.6529.io/", "Status", true)}
      </span>
    </footer>
  );
}
