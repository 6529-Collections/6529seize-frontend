import React from 'react';
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const IndexPage = () => (
  <>
    <Header extraClass="header-wp" />
    <div>
  {/*[if lt IE 7]> <html className="no-js ie6 oldie" lang="en-US"> <![endif]*/}{/*[if IE 7]>    <html className="no-js ie7 oldie" lang="en-US"> <![endif]*/}{/*[if IE 8]>    <html className="no-js ie8 oldie" lang="en-US"> <![endif]*/}{/*[if gt IE 8]><!*/}{/*<![endif]*/}
  <title>Email Protection | Cloudflare</title>
  <meta charSet="UTF-8" />
  <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta httpEquiv="X-UA-Compatible" content="IE=Edge" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" id="cf_styles-css" href="/cdn-cgi/styles/cf.errors.css" />
  {/*[if lt IE 9]><link rel="stylesheet" id='cf_styles-ie-css' href="/cdn-cgi/styles/cf.errors.ie.css" /><![endif]*/}
  <style dangerouslySetInnerHTML={{__html: "body{margin:0;padding:0}" }} />
  {/*[if gte IE 10]><!*/}
  {/*<![endif]*/}
  <div id="cf-wrapper">
    <div className="cf-alert cf-alert-error cf-cookie-error" id="cookie-alert" data-translate="enable_cookies">Please enable cookies.</div>
    <div id="cf-error-details" className="cf-error-details-wrapper">
      <div className="cf-wrapper cf-header cf-error-overview">
        <h1 data-translate="block_headline">Email Protection</h1>
        <h2 className="cf-subheadline"><span data-translate="unable_to_access">You are unable to access this email address</span> 6529.io</h2>
      </div>{/* /.header */}
      <div className="cf-section cf-wrapper">
        <div className="cf-columns two">
          <div className="cf-column">
            <p>The website from which you got to this page is protected by Cloudflare. Email addresses on that page have been hidden in order to keep them from being accessed by malicious bots. <strong>You must enable Javascript in your browser in order to decode the e-mail address</strong>.</p>
            <p>If you have a website and are interested in protecting it in a similar way, you can <a rel="noopener noreferrer" href="https://www.cloudflare.com/sign-up?utm_source=email_protection">sign up for Cloudflare</a>.</p>
          </div>
          <div className="cf-column">
            <div className="grid_4">
              <div className="rail">
                <div className="panel">
                  <ul className="nobullets">
                    <li><a rel="noopener noreferrer" className="modal-link-faq" href="https://support.cloudflare.com/hc/en-us/articles/200170016-What-is-Email-Address-Obfuscation-">How does Cloudflare protect email addresses on website from spammers?</a></li>
                    <li><a rel="noopener noreferrer" className="modal-link-faq" href="https://support.cloudflare.com/hc/en-us/categories/200275218-Getting-Started">Can I sign up for Cloudflare?</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{/* /.section */}
      <div className="cf-error-footer cf-wrapper w-240 lg:w-full py-10 sm:py-4 sm:px-8 mx-auto text-center sm:text-left border-solid border-0 border-t border-gray-300">
        <p className="text-13">
          <span className="cf-footer-item sm:block sm:mb-1">Cloudflare Ray ID: <strong className="font-semibold">8e5f95d3c8b210be</strong></span>
          <span className="cf-footer-separator sm:hidden">•</span>
          <span id="cf-footer-item-ip" className="cf-footer-item hidden sm:block sm:mb-1">
            Your IP:
            <button type="button" id="cf-footer-ip-reveal" className="cf-footer-ip-reveal-btn">Click to reveal</button>
            <span className="hidden" id="cf-footer-ip">34.136.44.93</span>
            <span className="cf-footer-separator sm:hidden">•</span>
          </span>
          <span className="cf-footer-item sm:block sm:mb-1"><span>Performance &amp; security by</span> <a rel="noopener noreferrer" href="https://www.cloudflare.com/5xx-error-landing" id="brand_link" target="_blank">Cloudflare</a></span>
        </p>
      </div>{/* /.error-footer */}
    </div>{/* /#cf-error-details */}
  </div>{/* /#cf-wrapper */}
</div>

  </>
);

export default IndexPage;