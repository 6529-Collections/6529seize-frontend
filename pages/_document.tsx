import { Html, Head, Main, NextScript } from "next/document";
import { AboutSection } from "./about/[section]";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="6529 SEIZE" />
        <meta name="version" content={process.env.VERSION} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href={process.env.API_ENDPOINT} />
        <link rel="preconnect" href="https://d3lqz0a4bldqgf.cloudfront.net" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <footer
          className="d-flex flex-column align-items-center justify-content-center gap-2"
          id="footer">
          <span className="d-flex align-items-center justify-content-center flex-wrap gap-2">
            <a
              href="https://twitter.com/punk6529"
              target="_blank"
              rel="noreferrer">
              <img
                width="0"
                height="0"
                style={{ height: "18px", width: "auto" }}
                src="/twitter.png"
                alt="punk6529 Twitter"
              />{" "}
              &#64;punk6529
            </a>
            |
            <a
              href="https://twitter.com/6529Collections"
              target="_blank"
              rel="noreferrer">
              <img
                width="0"
                height="0"
                style={{ height: "18px", width: "auto" }}
                src="/twitter.png"
                alt="6529Collections Twitter"
              />{" "}
              &#64;6529Collections
            </a>
            |
            <a
              href="https://discord.gg/join-om"
              target="_blank"
              rel="noreferrer">
              <img
                width="0"
                height="0"
                style={{ height: "18px", width: "auto" }}
                src="/discord.png"
                alt="OM Discord"
              />{" "}
              OM Discord
            </a>
            |
            <a href="https://6529.io" target="_blank" rel="noreferrer">
              <img
                width="0"
                height="0"
                style={{ height: "18px", width: "auto" }}
                src="/Seize_Logo_2.png"
                alt="6529.io"
              />{" "}
              6529.io
            </a>
            |
            <a
              href="https://github.com/6529-Collections"
              target="_blank"
              rel="noreferrer">
              <img
                width="0"
                height="0"
                style={{ height: "18px", width: "auto" }}
                src="/github_w.png"
                alt="6529-Collections"
              />{" "}
              6529-Collections
            </a>
          </span>
          <span className="d-flex align-items-center justify-content-center flex-wrap gap-2">
            <a href={`/about/${AboutSection.TERMS_OF_SERVICE}`}>
              Terms of Service
            </a>
            |{" "}
            <a href={`/about/${AboutSection.PRIVACY_POLICY}`}>Privacy Policy</a>
            | <a href={`/about/${AboutSection.COPYRIGHT}`}>Copyright</a>|{" "}
            <a href={`/about/${AboutSection.COOKIE_POLICY}`}>Cookie Policy</a>|{" "}
            <a href={`/about/${AboutSection.LICENSE}`}>License</a>|{" "}
            <a
              href="https://api.seize.io/docs"
              target="_blank"
              rel="noreferrer">
              API Documentation
            </a>
            |{" "}
            <a
              href={`https://status.seize.io/`}
              target="_blank"
              rel="noreferrer">
              Status
            </a>
          </span>
        </footer>
      </body>
    </Html>
  );
}
