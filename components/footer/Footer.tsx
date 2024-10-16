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

  return (
    <footer
      className="d-flex flex-column align-items-center justify-content-center gap-2"
      id="footer">
      <span className="d-flex align-items-center justify-content-center flex-wrap gap-2">
        {printLinkWithImage(
          "https://x.com/punk6529",
          "/twitter.png",
          "punk6529"
        )}{" "}
        |{" "}
        {printLinkWithImage(
          "https://x.com/6529Collections",
          "/twitter.png",
          "6529Collections"
        )}
        |{" "}
        {printLinkWithImage(
          "https://discord.gg/join-om",
          "/discord.png",
          "OM Discord"
        )}
        |{" "}
        {printLinkWithImage("https://6529.io", "/Seize_Logo_2.png", "6529.io")}|{" "}
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
        | {printLink(`/about/${AboutSection.PRIVACY_POLICY}`, "Privacy Policy")}
        | {printLink(`/about/${AboutSection.COPYRIGHT}`, "Copyright")}|{" "}
        {printLink(`/about/${AboutSection.COOKIE_POLICY}`, "Cookie Policy")}|{" "}
        {printLink(`/about/${AboutSection.LICENSE}`, "License")}|{" "}
        {printLink("https://api.seize.io/docs", "API Documentation")}|{" "}
        {printLink(`/about/${AboutSection.CONTACT_US}`, "Contact Us")}|{" "}
        {printLink("https://status.seize.io/", "Status")}
      </span>
    </footer>
  );
}
