import Image from "next/image";
import { Html, Head, Main, NextScript } from "next/document";
import { Container, Row, Col } from "react-bootstrap";

export default function Document() {
  return (
    <Html>
      <Head>
        <meta name="description" content="6529 SEIZE" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.cdnfonts.com/css/square-one-2"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
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
            <img src="/twitter.png"></img> @punk6529
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a
            href="https://twitter.com/6529Collections"
            target="_blank"
            rel="noreferrer">
            <img src="/twitter.png"></img> @6529Collections
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="https://discord.gg/join-om" target="_blank" rel="noreferrer">
            <img src="/discord.png"></img> OM Discord
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="https://6529.io" target="_blank" rel="noreferrer">
            <img src="/Seize_Logo_2.png"></img> 6529.io
          </a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/terms&conditions">Terms & Conditions</a>
        </footer>
      </body>
    </Html>
  );
}
