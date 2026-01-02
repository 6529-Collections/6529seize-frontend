import { AboutSection } from "@/enums";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";

export default function AboutPrivacyPolicy() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            Privacy Policy
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className={`${styles["lastUpdateText"]} text-right pt-3 pb-3`}>
          Last Updated: February 23, 2023
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <>
            <p>
              This Privacy Policy describes how 6529 Collection LLC d/b/a
              6529.io (&quot;<b>Seize</b>&quot;, &quot;<b>we</b>&quot;, &quot;
              <b>our</b>&quot;) processes personal information that we collect
              through our digital or online properties or services that link to
              this Privacy Policy (including as applicable, our website, social
              media pages, live events and other activities described in this
              Privacy Policy (collectively, the &quot; <b>Service</b>&quot;)).
            </p>
            <br />
            <h3>Index</h3>
            <br />
            <br />
            <ul>
              <li>Personal information we collect</li>
              <li>How we use your personal information</li>
              <li>How we share your personal information</li>
              <li>Your choices</li>
              <li>Other sites and services</li>
              <li>Security</li>
              <li>International data transfers</li>
              <li>Children</li>
              <li>Changes to this Privacy Policy</li>
              <li>How to contact us</li>
            </ul>
            <br />
            <h3>Personal information we collect</h3>
            <br />
            <br />
            <p>
              <b>Information you provide to us.</b> Personal information you may
              provide to us through the Service or otherwise includes:
            </p>
            <ul>
              <li>
                <b>Transactional data</b>, when you connect your Ethereum wallet
                to our website or minting pages, we read your public wallet data
                such as your Ethereum addresses and which tokens you have in
                your address in order to display those tokens on our Service or
                to allow you to mint an NFT on or through the Service. It is not
                possible to mint an NFT without connecting an Ethereum wallet in
                this manner.
              </li>
              <li>
                <b>Communications data</b> based on our exchanges with you,
                including when you contact us through the Service, social media,
                or otherwise.
              </li>
              <li>
                <b>Other data</b> not specifically listed here, which we will
                use as described in this Privacy Policy or as otherwise
                disclosed at the time of collection.
              </li>
            </ul>
            <p>
              <b>Third-party sources.</b>We may combine personal information we
              receive from you with public or personal information we may obtain
              from other sources, such as:
            </p>
            <ul>
              <li>
                <b>Public blockchains:</b> we obtain publicly available
                information about NFTs, NFT transactions and addresses from
                public blockchains like Ethereum. As a non-exclusive example, we
                display on our website which Ethereum addresses own our NFTs.
              </li>
              <li>
                <b>Social Media platforms:</b> social media platforms, and other
                publicly available sources. As a non-exclusive example, you may
                contact us on Twitter and we might learn your name from your
                Twitter public profile.
              </li>
              <li>
                <b>Third-party services:</b> such as virtual currency account
                services you link to the Services. This data may include your
                wallet address or other information associated with that account
                that is made available to us based on your account settings on
                that service.
                <br />
                As a non-exclusive example, when you connect your Ethereum
                wallet to our website, it shares your wallet address with us.
              </li>
            </ul>
            <p>
              <b>Automatic data collection.</b> We, our service providers, and
              our business partners may automatically log information about you,
              your computer or mobile device, and your interaction over time
              with the Service, our communications and other online services,
              such as:
            </p>
            <ul>
              <li>
                <b>Device data</b>, such as your computer or mobile
                device&apos;s operating system type and version, manufacturer
                and model, browser type, screen resolution, RAM and disk size,
                CPU usage, device type (e.g., phone, tablet), IP address, unique
                identifiers (including identifiers used for advertising
                purposes), language settings, mobile device carrier,
                radio/network information (e.g., Wi-Fi, LTE, 3G), and general
                location information such as city, state or geographic area.
                <br />
                As a non-exclusive example, we may serve a version of our
                webpage appropriate to the size of your screen.
              </li>
              <li>
                <b>Online activity data</b>, such as pages or screens you
                viewed, how long you spent on a page or screen, the website you
                visited before browsing to the Service, navigation paths between
                pages or screens, information about your activity on a page or
                screen, access times and duration of access, and whether you
                have opened our emails or clicked links within them.
              </li>
            </ul>
            <p>
              <b>Cookies.</b> Some of our automatic data collection is
              facilitated by cookies and similar technologies. For more
              information, see our{" "}
              <Link href={`/about/${AboutSection.COOKIE_POLICY}`}>
                Cookie Policy
              </Link>
              . We may also store a record of your preferences in respect of the
              use of these technologies in connection with the Service.
            </p>
            <br />
            <h3>How we use your personal information</h3>
            <br />
            <br />
            <p>
              We may use your personal information for the following purposes or
              as otherwise described at the time of collection:
            </p>
            <p>
              <b>Service delivery and operations.</b> We may use your personal
              information to:
            </p>
            <ul>
              <li>
                provide, operate and improve the Service and our business;
              </li>
              <li>
                personalize the service, including remembering your selections
                and preferences as you navigate the Service;
              </li>
              <li>enable you to mint an NFT;</li>
              <li>
                communicate with you about the Service, including by sending
                Service-related announcements, updates, security alerts, and
                support and administrative messages;
              </li>
              <li>
                understand your needs and interests, and personalize your
                experience with the Service and our communications; and
              </li>
              <li>
                provide support for the Service, and respond to your requests,
                questions and feedback.
              </li>
            </ul>
            <p>
              <b>Research and development.</b> We may use your personal
              information for research and development purposes, including to
              analyze and improve the Service and our business and to develop
              new products and services. As part of these activities, we may
              create aggregated, de-identified and/or anonymized data from
              personal information we collect. We make personal information into
              de-identified or anonymized data by removing information that
              makes the data personally identifiable to you. We may use this
              aggregated, de-identified or otherwise anonymized data and share
              it with third parties for our lawful business purposes, including
              to analyze and improve the Service and promote our business and
              will not attempt to reidentify any such data.
            </p>
            <p>
              <b>Service improvement and analytics.</b> We may use your personal
              information to analyze your usage of the Service, improve the
              Service, improve the rest of our business, help us understand user
              activity on the Service, including which pages are most and least
              visited and how visitors move around the Service, as well as user
              interactions with our emails, and to develop new products and
              services.
            </p>
            <p>
              <b>Compliance and protection.</b> We may use your personal
              information to:
            </p>
            <ul>
              <li>
                comply with applicable laws, lawful requests, and legal process,
                such as to respond to subpoenas, investigations or requests from
                government authorities;
              </li>
              <li>
                protect our, your or others&apos; rights, privacy, safety or
                property (including by making and defending legal claims);
              </li>
              <li>
                audit our internal processes for compliance with legal and
                contractual requirements or our internal policies;
              </li>
              <li>
                enforce the terms and conditions that govern the Service; and
              </li>
              <li>
                prevent, identify, investigate and deter fraudulent, harmful,
                unauthorized, unethical or illegal activity, including
                cyberattacks and identity theft.
              </li>
            </ul>
            <p>
              <b>With your consent.</b> In some cases, we may specifically ask
              for your consent to collect, use or share your personal
              information, such as when required by law.
            </p>
            <br />
            <h3>How we share your personal information</h3>
            <br />
            <br />
            <p>
              We may share your personal information with the following parties
              and as otherwise described in this Privacy Policy, in other
              applicable notices, or at the time of collection.
            </p>
            <p>
              <b>Affiliates.</b> Our corporate parent, subsidiaries, and
              affiliates.
            </p>
            <p>
              <b>Service providers.</b> Third parties that provide services on
              our behalf or help us operate the Service or our business (such as
              hosting, information technology, customer support, and website
              analytics).
            </p>
            <p>
              <b>Professional advisors.</b> Professional advisors, such as
              lawyers, auditors, bankers and insurers, where necessary in the
              course of the professional services that they render to us.
            </p>
            <p>
              <b>Authorities and others.</b> Law enforcement, government
              authorities, and private parties, as we believe in good faith to
              be necessary or appropriate for the Compliance and protection
              purposes described above.
            </p>
            <p>
              <b>Business transferees.</b> We may disclose personal information
              in the context of actual or prospective business transactions
              (e.g., investments in or sale of our company), for example, we may
              need to share certain personal information with prospective
              counterparties and their advisers. We may also disclose your
              personal information to an acquirer, successor, or assignee of
              6529 Collections as part of any merger, acquisition, sale of
              assets, or similar transaction, and/or in the event of an
              insolvency, bankruptcy, or receivership in which personal
              information is transferred to one or more third parties as one of
              our business assets.
            </p>
            <p>
              <b>Other users and the public.</b> Your transactional data is
              visible to other users of the Service and the public, including on
              the Ethereum blockchain, directly on Ethereum nodes and on a wide
              variety of websites and services that read directly from the
              Ethereum blockchain. This information can be seen, collected and
              used by others, including being cached, copied, screen captured or
              stored elsewhere by others (e.g., search engines), and we are not
              responsible for any such use of this information.
            </p>
            <br />
            <h3>Your choices</h3>
            <br />
            <br />
            <p>
              <b>Cookies.</b> For information about cookies employed by the
              Service and how to control them, see our{" "}
              <Link href={`/about/${AboutSection.COOKIE_POLICY}`}>
                Cookie Policy
              </Link>
              .
            </p>
            <p>
              <b>Blocking images/clear gifs:</b> Most browsers and devices allow
              you to configure your device to prevent images from loading. To do
              this, follow the instructions in your particular browser or device
              settings.
            </p>
            <p>
              <b>Do Not Track.</b> Some Internet browsers may be configured to
              send &quot;Do Not Track&quot; signals to the online services that
              you visit. We currently do not respond to &quot;Do Not Track&quot;
              signals. To find out more about &quot;Do Not Track,&quot; please
              visit{" "}
              <a
                href={`http://www.allaboutdnt.com`}
                target="_blank"
                rel="noopener noreferrer">
                http://www.allaboutdnt.com
              </a>
              .
            </p>
            <p>
              <b>Declining to provide information.</b> We need to collect
              personal information to provide certain services. If you do not
              provide the information we identify as required or mandatory, we
              may not be able to provide those services.
            </p>
            <p>
              <b>Linked third-party platforms.</b> If you choose to connect to
              the Service through a third-party platform, such as a virtual
              currency account service that you link to the Services, you may be
              able to use your settings in your account with that platform to
              limit the information we receive from it. If you revoke our
              ability to access information from a third-party platform, that
              choice will not apply to information that we have already received
              from that third party.
            </p>
            <br />
            <h3>Other sites and services</h3>
            <br />
            <br />
            <p>
              The Service may contain links to websites, mobile applications,
              and other online services operated by third parties. In addition,
              our content may be integrated into web pages or other online
              services that are not associated with us. These links and
              integrations are not an endorsement of, or representation that we
              are affiliated with, any third party. We do not control websites,
              mobile applications or online services operated by third parties,
              and we are not responsible for their actions. We encourage you to
              read the privacy policies of the other websites, mobile
              applications and online services you use.
            </p>
            <br />
            <h3>Security</h3>
            <br />
            <br />
            <p>
              We employ a number of technical, organizational and physical
              safeguards designed to protect the personal information we
              collect. However, security risk is inherent in all internet and
              information technologies, and we cannot guarantee the security of
              your personal information.
            </p>
            <br />
            <h3>International data transfer</h3>
            <br />
            <br />
            <p>
              We and our service providers may operate and process your personal
              information in various countries. Your personal information may be
              transferred to the United States or other locations where privacy
              laws may vary and not be as protective as those in your state,
              province, or country.
            </p>
            <br />
            <h3>Children</h3>
            <br />
            <br />
            <p>
              The Service is not intended for use by anyone under 18 years of
              age. If you are a parent or guardian of a child from whom you
              believe we have collected personal information in a manner
              prohibited by law, please{" "}
              <Link href={`/about/${AboutSection.CONTACT_US}`}>contact us</Link>
              . If we learn that we have collected personal information through
              the Service from a child without the consent of the child&apos;s
              parent or guardian as required by law, we will comply with
              applicable legal requirements to delete the information.
            </p>
            <br />
            <h3>Changes to this Privacy Policy</h3>
            <br />
            <br />
            <p>
              We reserve the right to modify this Privacy Policy at any time. If
              we make material changes to this Privacy Policy, we will notify
              you by updating the date of this Privacy Policy and posting it on
              the Service or other appropriate means. Any modifications to this
              Privacy Policy will be effective upon our posting the modified
              version (or as otherwise indicated at the time of posting). In all
              cases, your use of the Service after the effective date of any
              modified Privacy Policy indicates your acknowledging that the
              modified Privacy Policy applies to your interactions with the
              Service and our business.
            </p>
            <br />
            <h3>European Union residents / Your Rights</h3>
            <br />
            <br />
            <p>
              We have taken all appropriate measures to provide any information
              relating to your rights as well as how to exercise these rights.
              Under Chapter III of the GDPR you have the following rights:
            </p>
            <br />
            <p>
              <b>
                Transparent information, communication and modalities for the
                exercise of your rights
              </b>
              <br />
              You have the right to be provided with your data freely and in an
              intelligible and easily accessible form. Following your request,
              we shall provide information without undue delay and in any event
              within one month of receipt of the request. That period may be
              extended where necessary, taking into account the complexity and
              number of requests. In that case we will inform you for the
              reasons of the delay.
            </p>
            <br />
            <p>
              <b>
                Information to be provided where personal data are collected
                from the data subject
              </b>
              <br />
              You have the right to know the contact details of the agent who
              collects your data, the purposes of the processing for which the
              personal data are intended, the legal basis for the processing,
              the recipients or categories of recipients of the personal data
              and where applicable the fact that the controller intends to
              transfer personal data to a third country.
            </p>
            <br />
            <p>
              <b>Right of access</b>
              <br />
              You have the right to request and receive a copy of your personal
              data undergoing processing. However, for any further copies
              requested, we may charge you a reasonable fee that is based on
              administrative costs.
            </p>
            <br />
            <p>
              <b>Right to rectification</b>
              <br />
              You have the right to obtain from us within reasonable time the
              rectification of inaccurate personal data concerning you.
            </p>
            <br />
            <p>
              <b>Right to erasure (&apos;right to be forgotten&apos;)</b>
              <br />
              There is a right to ask for the erasure of your personal data and
              no longer processed where the personal data are no longer
              necessary in relation to the purposes for which they are
              controlled or otherwise processed.
              <br />
              <br />
              Thus, in the cases where we retain and process personal data in
              accordance with the provisions of Article 6(1)(c) of the GDPR, we
              may object to such a request and may keep the relevant personal
              data that are required in order for our us to comply with its
              legal obligations or the legal obligations of a Controller that
              cooperates with our us pursuant to the terms of a Data Processing
              Agreement.
            </p>
            <br />
            <p>
              <b>Right to restriction of processing</b>
              <br />
              We ensure that we have in place a procedure where you have the
              right to restrict the processing of your personal data.
              Nonetheless, for those personal data that are necessary for
              compliance with a legal obligation, we may object to the
              restriction.
            </p>
            <br />
            <p>
              <b>Right to data portability</b>
              <br />
              You have the right to receive the personal data concerning you,
              which you have provided to us, in a structured, commonly used and
              machine-readable format and you have the right to transmit those
              data to another controller without hindrance from the controller
              to which the personal data have been provided.
            </p>
            <br />
            <p>
              <b>Right to object</b>
              <br />
              You have the right to object to the processing of your personal
              data. However, since we lawfully process such data under Article
              6(1)(c), we will still have the right to process the data.
            </p>
            <br />
            <p>
              <b>Automated individual decision-making, including profiling</b>
              <br />
              You have the right to be subject to a decision solely on automated
              processing, including profiling, which produces legal effects
              concerning you or similarly significantly affects you.
            </p>
            <br />
            <p>
              <b>Ethereum blockchain data</b>
              <br />
              For avoidance of doubt, we consider that information about
              Ethereum addresses, ENS names, tokens and token transactions on
              the Ethereum blockchain and similar public blockchains, is public
              data and we may store, process or display it without limitation.
            </p>
            <br />
            <h3>How to contact us</h3>
            <br />
            <br />
            <ul>
              <li>
                Email:{" "}
                <a
                  href="mailto:privacy@6529.io"
                  target="_blank"
                  rel="noopener noreferrer">
                  privacy&#64;6529.io
                </a>
              </li>
              <li>
                Mail:
                <br />
                6529 Collection LLC
                <br />
                2810 N Church St
                <br />
                #76435 Wilmington, DE 19802-4447
                <br />
                United States of America
              </li>
            </ul>
          </>
        </Col>
      </Row>
    </Container>
  );
}
