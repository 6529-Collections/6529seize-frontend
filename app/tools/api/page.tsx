import CodeExample from "@/components/code-example/CodeExample";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

export default function AboutApi() {
  const nodeJsAuthExample = `import { Wallet } from 'ethers';
import fetch from 'node-fetch';

export async function loginAndFetchFeed() {
  const clientAddress = '0x...';
  const clientPrivateKey = '0x...'; // ⚠️ Do not hardcode private keys in production!

  // Rebuild wallet from private key
  const wallet = new Wallet(clientPrivateKey);

  // 1. Get nonce from server
  const nonceResp = await fetch(
    \`https://api.6529.io/api/auth/nonce?signer_address=\${clientAddress}&short_nonce=true\`,
    {
      headers: { accept: 'application/json' },
      method: 'GET'
    }
  );

  // short_nonce=true → nonce is a UUID (easier for programmatic use).
  // short_nonce=false → nonce is a long, multiline welcome message (better for GUIs, but may cause encoding issues).

  const { nonce, server_signature } = await nonceResp.json();

  // 2. Sign the nonce locally
  const signedNonce = await wallet.signMessage(nonce);

  // 3. Send signed nonce back to login endpoint
  const loginResp = await fetch(
    \`https://api.6529.io/api/auth/login?signer_address=\${clientAddress}\`,
    {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        client_address: clientAddress,
        client_signature: signedNonce,
        server_signature
      })
    }
  );

  const { token } = await loginResp.json();

  // 4. Fetch feed with the received authorization token
  const feedResp = await fetch('https://api.6529.io/api/feed', {
    headers: {
      accept: 'application/json',
      authorization: \`Bearer \${token}\`
    },
    method: 'GET'
  });

  const feed = await feedResp.json();
  console.log('Feed:', feed);
}`;


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
  return (
    <main className={styles["main"]}>
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h1>
              6529.io API
            </h1>
          </Col>
        </Row>
        <Row className="pt-2">
          <Col>
            <p className="font-larger font-bolder">Introduction</p>
            <p>
              The 6529.io website communicates with its backend via a{" "}
              <b>JSON-encoded REST API</b>.
            </p>

            <p>
              This API is open, documented, and available for external use. You
              can find the full reference here:{" "}
              <a
                href={"https://api.6529.io/docs/"}
                target="_blank" rel="noopener noreferrer"
                className="tw-text-blue-500 tw-font-semibold">
                https://api.6529.io/docs
              </a>
            </p>

            <p>
              Some endpoints are public, some require authentication, and some
              can be used in both modes—returning more contextual information if
              the user is authenticated.
            </p>

            <div
              className="p-4 rounded mb-4 tw-font-medium"
              style={{
                backgroundColor: "rgb(26, 26, 26)",
                border: "1px solid rgb(44, 44, 44)",
              }}>
              ℹ️ Some routes are still undocumented. We plan to expand the
              documentation over time.
            </div>
          </Col>
        </Row>

        <Row className="pt-2">
          <Col>
            <p className="font-larger font-bolder">Key terminology</p>
            <p>
              This is not a comprehensive glossary, but an overview of the most
              common terms you'll encounter when working with the API:
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
                <b>Brain</b> - The social network inside 6529.io, consisting of
                waves where identities can communicate, vote, and share media.
              </li>
              <li>
                <b>Wave</b> - A channel within Brain. Think of it as a topic,
                chatroom, or sub-community Waves can be public or private.
                Access may differ: e.g. you might be able to view a wave but not
                post in it, or post but not participate in competitions.
              </li>
              <li>
                <b>Drop</b> - A message inside a wave. Interaction rules differ
                by type. For example, you can react to a CHAT drop but vote on a
                PARTICIPATORY drop. Drops types are:
                <ul>
                  <li>CHAT → a standard chat message</li>
                  <li>PARTICIPATORY → a competition entry</li>
                  <li>
                    WINNER → a previously participatory drop elected as a winner
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
          </Col>
        </Row>
        <Row className="pt-2">
          <Col>
            <p className="font-larger font-bolder">Authentication</p>
            <p>Authentication is based on Ethereum signatures.</p>

            <p>The flow works as follows:</p>

            <ol>
              <li>Request a nonce for the wallet you want to authenticate.</li>
              <li>Sign the nonce locally using your wallet.</li>
              <li>Send the signature back to the server.</li>
              <li>
                Receive a JWT bearer token, which you can include in headers of
                subsequent requests.
              </li>
            </ol>
            <p>Here's a full example in Node.js using ethers and node-fetch:</p>

            <CodeExample code={nodeJsAuthExample} />
          </Col>
        </Row>
        <Row className="pt-2">
          <Col>
            <p className="font-larger font-bolder">Creating drops with embedded media</p>

            <p>Current API supports multipart upload</p>

            <p>The flow works as follows:</p>

            <ol>
              <li>Read the file</li>
              <li>Send the file name and mime type (not the file itself) to our API</li>
              <li>Get back upload ID and temporary S3 key</li>
              <li>Optional: Split the file to chunks/parts.</li>
              <li>Get S3 upload URL for each part from our API</li>
              <li>Upload each part to S3 using the signed urls gotten from previous steps and keep the ETags from responses</li>
              <li>When all parts have finished uploading, complete the upload bt supplying the ETags to our API</li>
              <li>Use the media URL from completion API response to create a drop</li>
            </ol>

            <p>Here's a full example in Node.js:</p>

            <CodeExample code={nodeJsMediaDropExample} />
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "API", description: "API" });
}
