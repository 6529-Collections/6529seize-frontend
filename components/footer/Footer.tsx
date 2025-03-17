import { AboutSection } from "../../pages/about/[section]";

export default function Footer() {
  function printLink(href: string, text: string) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {text}
      </a>
    );
  }

  function printLinkWithImage(href: string, img: string, text: string) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
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

  function printSeparator() {
    return <span>|</span>;
  }

  return (
    <footer
      className="d-flex flex-column align-items-center justify-content-center gap-2"
      id="footer">
      <span className="d-flex align-items-center justify-content-center flex-wrap gap-2">
        {printLinkWithImage(
          "https://x.com/punk6529",
          "/twitter.png",
          "@punk6529"
        )}
        {printSeparator()}
        {printLinkWithImage(
          "https://x.com/6529Collections",
          "/twitter.png",
          "@6529Collections"
        )}
        {printSeparator()}
        {printLinkWithImage(
          "https://discord.gg/join-om",
          "/discord.png",
          "OM Discord"
        )}
        {printSeparator()}
        {printLinkWithImage(
          "https://github.com/6529-Collections",
          "/github_w.png",
          "6529-Collections"
        )}
      </span>
      <span className="d-flex align-items-center justify-content-center flex-wrap gap-2">
        {printLink(
          `/about/${AboutSection.TERMS_OF_SERVICE}`,
          "Terms of Service"
        )}
        {printSeparator()}
        {printLink(`/about/${AboutSection.PRIVACY_POLICY}`, "Privacy Policy")}
        {printSeparator()}
        {printLink(`/about/${AboutSection.COPYRIGHT}`, "Copyright")}
        {printSeparator()}
        {printLink(`/about/${AboutSection.COOKIE_POLICY}`, "Cookie Policy")}
        {printSeparator()}
        {printLink(`/about/${AboutSection.LICENSE}`, "License")}
        {printSeparator()}
        {printLink("https://api.6529.io/docs", "API Documentation")}
        {printSeparator()}
        {printLink(`/about/${AboutSection.CONTACT_US}`, "Contact Us")}
        {printSeparator()}
        {printLink("https://status.6529.io/", "Status")}
      </span>
    </footer>
  );
}
