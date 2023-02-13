import { Html, Head, Main, NextScript } from "next/document";
import Image from "next/image";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="6529 SEIZE" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href={process.env.API_ENDPOINT} />
        <link rel="preconnect" href="https://d3lqz0a4bldqgf.cloudfront.net" />
        {/* Google Analytics tracking code */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-71NLVV3KY3`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-71NLVV3KY3');
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        <footer
          className="d-flex align-items-center justify-content-center flex-wrap"
          id="footer">
          <a
            href="https://twitter.com/punk6529"
            target="_blank"
            rel="noreferrer">
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ height: "18px", width: "auto" }}
              src="/twitter.png"
              alt="punk6529 Twitter"
            />{" "}
            @punk6529
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a
            href="https://twitter.com/6529Collections"
            target="_blank"
            rel="noreferrer">
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ height: "18px", width: "auto" }}
              src="/twitter.png"
              alt="6529Collections Twitter"
            />{" "}
            @6529Collections
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="https://discord.gg/join-om" target="_blank" rel="noreferrer">
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ height: "18px", width: "auto" }}
              src="/discord.png"
              alt="OM Discrod"
            />{" "}
            OM Discord
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="https://6529.io" target="_blank" rel="noreferrer">
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ height: "18px", width: "auto" }}
              src="/Seize_Logo_2.png"
              alt="6529.io"
            />{" "}
            6529.io
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/about?section=terms-of-service">Terms of Service</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/about?section=privacy-policy">Privacy Policy</a>
		  &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/about?section=cookie-policy">Cookie Policy</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/about?section=license">License</a>
        </footer>
      </body>
    </Html>
  );
}
