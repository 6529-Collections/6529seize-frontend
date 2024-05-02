import styles from "./About.module.scss";
import { Col, Container, Row } from "react-bootstrap";

export default function AboutCopyright() {
  return (
    <Container>
      <Row>
        <Col>
          <h1 className="float-none">Copyright</h1>
        </Col>
      </Row>
      <Row>
        <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
          Last Updated: April 23, 2024
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p className="font-larger font-bolder">Introduction</p>
          <p>
            Seize.io, a platform of 6529 Collection LLC, respects the
            intellectual property rights of others and expects its users to do
            the same. It is Seize.io&apos;s policy to respond to clear notices
            of alleged copyright infringement that comply with the Digital
            Millennium Copyright Act (DMCA).
          </p>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p className="font-larger font-bolder">
            Copyright Infringement Notification
          </p>
          <p>
            If you believe that your copyrighted work has been copied in a way
            that constitutes copyright infringement and is accessible through
            the Seize.io service, you may notify 6529 Collection LLC&apos;s
            copyright agent, providing the following information:
          </p>
          <ol>
            <li>
              A physical or electronic signature of a person authorized to act
              on behalf of the owner of an exclusive right that is allegedly
              infringed.
            </li>
            <li>
              Identification of the copyrighted work claimed to have been
              infringed, or, if multiple copyrighted works at a single online
              site are covered by a single notification, a representative list
              of such works at that site.
            </li>
            <li>
              Identification of the material that is claimed to be infringing or
              to be the subject of infringing activity and that is to be removed
              or access to which is to be disabled, and information reasonably
              sufficient to permit the service provider to locate the material.
            </li>
            <li>
              Information reasonably sufficient to permit the service provider
              to contact the complaining party, such as an address, telephone
              number, and, if available, an electronic mail address at which the
              complaining party may be contacted.
            </li>
            <li>
              A statement that the complaining party has a good faith belief
              that use of the material in the manner complained of is not
              authorized by the copyright owner, its agent, or the law.
            </li>
            <li>
              A statement that the information in the notification is accurate,
              and under penalty of perjury, that the complaining party is
              authorized to act on behalf of the owner of an exclusive right
              that is allegedly infringed.
            </li>
          </ol>
          <p>All DMCA notices should be sent to:</p>
          <p>
            DMCA Compliance, 6529 Collection LLC, 2810 N Church Street, PMB
            76435, Wilmington, DE 19802-4447
            <br />
            Email: <a href="mailto:6529Ops@6529.io">6529Ops@6529.io</a>
            <br />
            Phone: 302.219.0696
          </p>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p className="font-larger font-bolder">Counter-Notification</p>
          <p>
            If you believe that your content that was removed (or to which
            access was disabled) is not infringing, or that you have the
            authorization from the copyright owner, the copyright owner&apos;s
            agent, or pursuant to the law, to post and use the content in your
            submission, you may send a counter-notice containing the following
            information to 6529 Collection&apos;s copyright agent:
          </p>
          <ol>
            <li>Your physical or electronic signature.</li>
            <li>
              Identification of the content that has been removed or to which
              access has been disabled and the location at which the content
              appeared before it was removed or access to it was disabled.
            </li>
            <li>
              A statement that you have a good faith belief that the content was
              removed or disabled as a result of mistake or a misidentification
              of the content.
            </li>
            <li>
              Your name, address, telephone number, and email address, a
              statement that you consent to the jurisdiction of the federal
              court in [Jurisdiction], and a statement that you will accept
              service of process from the person who provided notification of
              the alleged infringement.
            </li>
          </ol>
          <p>All DMCA notices should be sent to:</p>
          <p>
            DMCA Compliance, 6529 Collection LLC, 2810 N Church Street, PMB
            76435, Wilmington, DE 19802-4447
            <br />
            Email: <a href="mailto:6529Ops@6529.io">6529Ops@6529.io</a>
            <br />
            Phone: 302.219.0696
          </p>
          <p>
            If a counter-notice is received by our Copyright Agent, 6529
            Collection LLC may send a copy of the counter-notice to the original
            complaining party informing that person that it may replace the
            removed content or cease disabling it in 10 business days. Unless
            the copyright owner files an action seeking a court order against
            the content provider, member, or user, the removed content may be
            replaced, or access to it restored, in 10 to 14 business days or
            more after receipt of the counter-notice, at 6529 Collection
            LLC&apos;s discretion.
          </p>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p className="font-larger font-bolder">Repeat Infringer Policy</p>
          <p>
            In accordance with the DMCA and other applicable law, 6529
            Collection LLC has adopted a policy of terminating, in appropriate
            circumstances and at 6529 Collection LLC&apos;s sole discretion,
            users who are deemed to be repeat infringers. 6529 Collection LLC
            may also at its sole discretion limit access to the Seize.io and/or
            terminate the accounts of any users who infringe any intellectual
            property rights of others, whether or not there is any repeat
            infringement.
          </p>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p className="font-larger font-bolder">Modifications to the Policy</p>
          <p>
            6529 Collection LLC reserves the right to modify the terms of this
            DMCA Policy at any time and for any reason. By continuing to access
            or use the Seize.io after those revisions become effective, you
            agree to be bound by the revised policy.
          </p>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p className="font-larger font-bolder">Contact Information</p>
          <p>
            For any questions regarding this DMCA Policy, please contact our
            Copyright Agent&apos;s as follows:
          </p>
          <p>All DMCA notices should be sent to:</p>
          <p>
            DMCA Compliance, 6529 Collection LLC, 2810 N Church Street, PMB
            76435, Wilmington, DE 19802-4447
            <br />
            Email: <a href="mailto:6529Ops@6529.io">6529Ops@6529.io</a>
            <br />
            Phone: 302.219.0696
          </p>
        </Col>
      </Row>
    </Container>
  );
}
