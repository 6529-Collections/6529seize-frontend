import CodeExample from "@/components/code-example/CodeExample";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
  ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME,
  ABOUT_SECTION_HEADING_CLASS_NAME,
  CONTENT_PAGE_CONTAINER_CLASS,
  CONTENT_PAGE_MAIN_CLASS,
} from "@/components/about/AboutLayout";

const API_PAGE_LOCALE = DEFAULT_LOCALE;
const API_AUTHENTICATION_PATH = "/tools/api/authentication";
const API_LINK_CLASS_NAME =
  "hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
const API_SECTION_CLASS_NAME =
  "tw-w-full tw-text-base tw-leading-7 tw-text-iron-300 [&_b]:tw-font-semibold [&_b]:tw-text-iron-100 [&_li]:tw-mb-3 [&_li::marker]:tw-text-iron-600 [&_ol]:tw-mb-0 [&_ol]:tw-mt-5 [&_ol]:tw-pl-6 [&>p]:tw-mb-5 [&_ul]:tw-mb-0 [&_ul]:tw-mt-5 [&_ul]:tw-pl-6";
const API_SECTION_HEADING_CLASS_NAME = `${ABOUT_SECTION_HEADING_CLASS_NAME} tw-mb-3`;

const nodeJsMediaDropExample = `import fetch from "node-fetch";
import {readFile} from "fs/promises";
import {extname} from "path";
import mime from "mime-types";

async function run() {
    // 0) Authenticate and get token
    // ...
    // 1) read file
    const filePath = "/Users/exampleuser/Desktop/example_picture.jpg";
    const fileBytes = await readFile(filePath);
    const fileName = filePath.split(/[\\\\/]/).pop();

    const contentType = mime.lookup(extname(fileName)) || "application/octet-stream";
    console.log(\`Read \${fileName} (\${fileBytes.length} bytes, \${contentType})\`);

    // 2) start multipart
    const {upload_id, key} = await startMultipartUpload({
        token,
        fileName,
        contentType,
    });
    console.log("Started multipart:", {upload_id, key});

    // 3) get part URL
    const part_no = 1; // single-part example, but with larger files it might be worth to chunk them.
    const uploadUrl = await getPartUploadUrl({token, upload_id, key, part_no});
    console.log("Got pre-signed part URL");

    // 4) PUT bytes to S3
    const etag = await putPartToS3({uploadUrl, bytes: fileBytes, contentType});
    console.log("Uploaded part, ETag:", etag);

    // 5) complete
    const mediaUrl = await completeMultipartUpload({
        token,
        upload_id,
        key,
        parts: [{part_no, etag}],
    });
    console.log("Multipart complete. media_url:", mediaUrl);

    // 6) create drop
    const drop = await createDrop({
        token,
        mediaUrl,
        mimeType: contentType,
        signerAddress: wallet.address,
    });
    console.log("Drop created:", drop);
}

async function startMultipartUpload({token, fileName, contentType}) {
    const resp = await fetch("https://api.6529.io/api/drop-media/multipart-upload", {
        method: "POST",
        headers: {
            accept: "application/json",
            authorization: \`Bearer \${token}\`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            file_name: fileName,
            content_type: contentType,
        }),
    });
    if (!resp.ok) {
        throw new Error(
            \`startMultipartUpload failed: \${resp.status} \${resp.statusText} - \${await resp.text()}\`
        );
    }
    return resp.json();
}

async function getPartUploadUrl({token, upload_id, key, part_no}) {
    const resp = await fetch("https://api.6529.io/api/drop-media/multipart-upload/part", {
        method: "POST",
        headers: {
            accept: "application/json",
            authorization: \`Bearer \${token}\`,
            "content-type": "application/json",
        },
        body: JSON.stringify({upload_id, key, part_no}),
    });
    if (!resp.ok) {
        throw new Error(
            \`getPartUploadUrl failed: \${resp.status} \${resp.statusText} - \${await resp.text()}\`
        );
    }
    const {upload_url} = await resp.json();
    return upload_url;
}

async function putPartToS3({uploadUrl, bytes, contentType}) {
    const putResp = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "content-type": contentType,
        },
        body: bytes,
    });
    if (!putResp.ok) {
        throw new Error(
            \`S3 upload part failed: \${putResp.status} \${putResp.statusText} - \${await putResp.text()}\`
        );
    }
    const rawETag = putResp.headers.get("etag") || putResp.headers.get("ETag");
    const etag = rawETag?.replace(/^"+|"+$/g, "");
    if (!etag) throw new Error("Missing ETag from S3 response");
    return etag;
}

async function completeMultipartUpload({token, upload_id, key, parts}) {
    const resp = await fetch("https://api.6529.io/api/drop-media/multipart-upload/completion", {
        method: "POST",
        headers: {
            accept: "application/json",
            authorization: \`Bearer \${token}\`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            upload_id,
            key,
            parts,
        }),
    });
    if (!resp.ok) {
        throw new Error(
            \`completeMultipartUpload failed: \${resp.status} \${resp.statusText} - \${await resp.text()}\`
        );
    }
    const json = await resp.json();
    return json.media_url;
}

async function createDrop({token, mediaUrl, mimeType, signerAddress}) {
    const body = {
        title: null,
        drop_type: "CHAT",
        parts: [
            {
                content: null,
                quoted_drop: null,
                media: [{url: mediaUrl, mime_type: mimeType}],
            },
        ],
        mentioned_users: [],
        referenced_nfts: [],
        metadata: [],
        signature: null,
        is_safe_signature: false,
        signer_address: signerAddress,
        wave_id: 'TARGET_WAVE_ID_GOES_HERE'
    };

    const resp = await fetch("https://api.6529.io/api/drops", {
        method: "POST",
        headers: {
            accept: "application/json",
            authorization: \`Bearer \${token}\`,
            "content-type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        throw new Error(\`Create drop failed: \${resp.status} \${resp.statusText} - \${await resp.text()}\`);
    }
    return await resp.json();
}

run().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});`;

export default function AboutApi() {
  return (
    <main className={clsx(styles["main"], CONTENT_PAGE_MAIN_CLASS)}>
      <Container
        fluid
        className={`${CONTENT_PAGE_CONTAINER_CLASS} tw-max-w-3xl sm:tw-pt-12`}
      >
        <Row>
          <Col>
            <h1 className={ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME}>
              6529.io API
            </h1>
          </Col>
        </Row>
        <Row className="tw-pt-5">
          <Col>
            <section
              aria-labelledby="api-introduction-heading"
              className={API_SECTION_CLASS_NAME}
            >
              <h2
                id="api-introduction-heading"
                className={API_SECTION_HEADING_CLASS_NAME}
              >
                Introduction
              </h2>
              <p>
                The 6529.io website communicates with its backend via a{" "}
                <b>JSON-encoded REST API</b>.
              </p>

              <p>
                This API is open, documented, and available for external use.
                You can find the full reference here:{" "}
                <a
                  href={"https://api.6529.io/docs/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={API_LINK_CLASS_NAME}
                >
                  https://api.6529.io/docs
                </a>
              </p>

              <p>
                Some endpoints are public, some require authentication, and some
                can be used in both modes—returning more contextual information
                if the user is authenticated.
              </p>

              <div className="tw-mb-0 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-font-medium tw-text-iron-200">
                <InformationCircleIcon
                  aria-hidden="true"
                  className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-primary-300"
                />
                <p className="tw-m-0 tw-leading-6">
                  Some routes are still undocumented. We plan to expand the
                  documentation over time.
                </p>
              </div>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-8">
          <Col>
            <section
              aria-labelledby="api-authentication-guide-heading"
              className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-text-base tw-leading-7 tw-text-iron-300"
            >
              <h2
                id="api-authentication-guide-heading"
                className="tw-mb-2 tw-text-lg tw-font-bold tw-text-iron-50"
              >
                {t(API_PAGE_LOCALE, "tools.api.authCallout.title")}
              </h2>
              <p className="tw-mb-3 tw-text-iron-300">
                {t(API_PAGE_LOCALE, "tools.api.authCallout.description")}
              </p>
              <Link
                href={API_AUTHENTICATION_PATH}
                className={API_LINK_CLASS_NAME}
              >
                {t(API_PAGE_LOCALE, "tools.api.authCallout.link")}
              </Link>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-8">
          <Col>
            <section
              aria-labelledby="api-key-terminology-heading"
              className={API_SECTION_CLASS_NAME}
            >
              <h2
                id="api-key-terminology-heading"
                className={API_SECTION_HEADING_CLASS_NAME}
              >
                Key terminology
              </h2>
              <p>
                This is not a comprehensive glossary, but an overview of the
                most common terms you&apos;ll encounter when working with the
                API:
              </p>
              <ul>
                <li>
                  <b>Identity</b> - A representation of a user in the system. An
                  identity consists of one (or more, in case of consolidation)
                  Ethereum wallet addresses. Authenticating as an identity
                  involves signing a message with one of its Ethereum wallets.
                </li>
                <li>
                  <b>Profile</b> - A set of properties associated with an
                  identity. A profile may include a handle, bio, NIC statements,
                  etc. Note: a profile is not the same as an identity.
                </li>
                <li>
                  <b>Brain</b> - The social network inside 6529.io, consisting
                  of waves where identities can communicate, vote, and share
                  media.
                </li>
                <li>
                  <b>Wave</b> - A channel within Brain. Think of it as a topic,
                  chatroom, or sub-community Waves can be public or private.
                  Access may differ: e.g. you might be able to view a wave but
                  not post in it, or post but not participate in competitions.
                </li>
                <li>
                  <b>Drop</b> - A message inside a wave. Interaction rules
                  differ by type. For example, you can react to a CHAT drop but
                  vote on a PARTICIPATORY drop. Drops types are:
                  <ul>
                    <li>CHAT → a standard chat message</li>
                    <li>PARTICIPATORY → a competition entry</li>
                    <li>
                      WINNER → a previously participatory drop elected as a
                      winner
                    </li>
                  </ul>
                </li>
                <li>
                  <b>Groups</b> - Sets of identities meeting predefined criteria
                  (e.g. TDH, REP, NIC, etc).
                </li>
                <li>
                  <b>Groups</b> are used for filtering community members and
                  regulating access to waves.
                </li>
                <li>
                  <b>REP</b> - Tags with metrics that identities can attach to
                  each other. These can be used when forming groups.
                </li>
                <li>
                  <b>NIC</b> - Trust ratings that identities give each other to
                  validate authenticity. Also usable in groups.
                </li>
              </ul>
            </section>
          </Col>
        </Row>
        <Row className="tw-pt-8">
          <Col>
            <section
              aria-labelledby="api-authentication-quickstart-heading"
              className={API_SECTION_CLASS_NAME}
            >
              <h2
                id="api-authentication-quickstart-heading"
                className={API_SECTION_HEADING_CLASS_NAME}
              >
                {t(API_PAGE_LOCALE, "tools.api.authentication.title")}
              </h2>
              <p>
                {t(
                  API_PAGE_LOCALE,
                  "tools.api.authentication.basedOnSignatures"
                )}
              </p>
              <p>
                {t(API_PAGE_LOCALE, "tools.api.authentication.externalNote")}{" "}
                <Link
                  href={API_AUTHENTICATION_PATH}
                  className={API_LINK_CLASS_NAME}
                >
                  {t(API_PAGE_LOCALE, "tools.api.authentication.fullGuideLink")}
                </Link>
              </p>

              <p>{t(API_PAGE_LOCALE, "tools.api.authentication.flowIntro")}</p>

              <ol>
                <li>
                  {t(
                    API_PAGE_LOCALE,
                    "tools.api.authentication.requestSessionMessage"
                  )}
                </li>
                <li>
                  {t(API_PAGE_LOCALE, "tools.api.authentication.signMessage")}
                </li>
                <li>
                  {t(API_PAGE_LOCALE, "tools.api.authentication.sendSignature")}
                </li>
                <li>
                  {t(API_PAGE_LOCALE, "tools.api.authentication.receiveToken")}
                </li>
              </ol>
            </section>
          </Col>
        </Row>
        <Row className="tw-pt-8">
          <Col>
            <section
              aria-labelledby="api-embedded-media-heading"
              className={API_SECTION_CLASS_NAME}
            >
              <h2
                id="api-embedded-media-heading"
                className={API_SECTION_HEADING_CLASS_NAME}
              >
                Creating drops with embedded media
              </h2>

              <p>Current API supports multipart upload</p>

              <p>The flow works as follows:</p>

              <ol>
                <li>Read the file</li>
                <li>
                  Send the file name and mime type (not the file itself) to our
                  API
                </li>
                <li>Get back upload ID and temporary S3 key</li>
                <li>Optional: Split the file to chunks/parts.</li>
                <li>Get S3 upload URL for each part from our API</li>
                <li>
                  Upload each part to S3 using the signed urls gotten from
                  previous steps and keep the ETags from responses
                </li>
                <li>
                  When all parts have finished uploading, complete the upload by
                  supplying the ETags to our API
                </li>
                <li>
                  Use the media URL from completion API response to create a
                  drop
                </li>
              </ol>

              <p className="tw-mt-5">Here&apos;s a full example in Node.js:</p>

              <CodeExample code={nodeJsMediaDropExample} />
            </section>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({ title: "API | Tools", description: "API" });
}
