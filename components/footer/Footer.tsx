import { AboutSection } from "@/types/enums";

export default function Footer() {
  function printLink(href: string, text: string, newTab: boolean = false) {
    const target = newTab ? "_blank" : "_self";
    return (
      <a
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
        href={href}
        target={target}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        <img
          width="0"
          height="0"
          style={{ height: "18px", width: "auto" }}
          src={img}
          alt={text}
        />{" "}
        {text}
      </a>
    );
  }

  return (
    <footer
      className="tailwind-scope tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-900"
      id="footer"
    >
      <span className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-5 tw-gap-y-2">
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
      <span className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-5 tw-gap-y-2">
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
