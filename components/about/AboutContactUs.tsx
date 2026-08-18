import Link from "next/link";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";

const CONTACT_LINK_CLASS =
  "tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export default function AboutContactUs() {
  return (
    <article
      className={`tw-w-full tw-pb-16 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8">
        <div className="tw-max-w-4xl">
          <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
            Contact Us
          </h1>
          <p className="tw-m-0 tw-mt-6 tw-text-pretty tw-text-lg tw-leading-8 tw-text-iron-200 sm:tw-text-xl sm:tw-leading-8">
            The best way to find us at:{" "}
            <Link
              className={`${CONTACT_LINK_CLASS} tw-break-all`}
              href="https://x.com/6529collections"
              rel="noopener noreferrer"
              target="_blank"
            >
              https://x.com/6529collections
            </Link>
          </p>
          <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-400">
            or email us at{" "}
            <a className={CONTACT_LINK_CLASS} href="mailto:support@6529.io">
              support@6529.io
            </a>
          </p>
        </div>
      </header>

      <section
        aria-labelledby="alternative-contact-heading"
        className="tw-max-w-4xl tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-py-10 sm:tw-px-2 sm:tw-py-12"
      >
        <h2
          className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
          id="alternative-contact-heading"
        >
          Alternative, but not as good, methods to contact us are:
        </h2>
        <ul className="tw-m-0 tw-mt-6 tw-space-y-4 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600">
          <li className="tw-pl-1">
            Trying to get the attention of &#64;
            <Link
              className={CONTACT_LINK_CLASS}
              href="https://x.com/punk6529"
              rel="noopener noreferrer"
              target="_blank"
            >
              punk6529
            </Link>{" "}
            or &#64;
            <Link
              className={CONTACT_LINK_CLASS}
              href="https://x.com/6529er"
              rel="noopener noreferrer"
              target="_blank"
            >
              6529er
            </Link>{" "}
            or &#64;
            <Link
              className={CONTACT_LINK_CLASS}
              href="https://x.com/teexels"
              rel="noopener noreferrer"
              target="_blank"
            >
              teexels
            </Link>{" "}
            on Twitter
          </li>
          <li className="tw-pl-1">
            Trying to get the attention of &#64;
            <Link
              className={CONTACT_LINK_CLASS}
              href="https://x.com/punk6529"
              rel="noopener noreferrer"
              target="_blank"
            >
              punk6529
            </Link>
            , &#64;
            <Link
              className={CONTACT_LINK_CLASS}
              href="https://x.com/6529er"
              rel="noopener noreferrer"
              target="_blank"
            >
              6529er
            </Link>{" "}
            or &#64;
            <Link
              className={CONTACT_LINK_CLASS}
              href="https://x.com/teexels"
              rel="noopener noreferrer"
              target="_blank"
            >
              teexels
            </Link>{" "}
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="postal-address-intro"
        className="tw-max-w-4xl tw-px-1 tw-py-10 sm:tw-px-2 sm:tw-py-12"
      >
        <p
          className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-200"
          id="postal-address-intro"
        >
          If, for some strange reason, you would like to send us a letter or
          postcard, you can do so here:
        </p>
        <address className="tw-mt-6 tw-text-base tw-not-italic tw-leading-7 tw-text-iron-300">
          6529 Collection LLC
          <br />
          2810 N Church St
          <br />
          #76435 Wilmington, DE 19802-4447
          <br />
          United States of America
        </address>
      </section>
    </article>
  );
}
