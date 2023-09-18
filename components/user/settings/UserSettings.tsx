import { useEffect, useRef, useState } from "react";
import styles from "./UserSettings.module.scss";
import { fetchUrl } from "../../../services/6529api";
import { ENS } from "../../../entities/IENS";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useAccount } from "wagmi";
import { areEqualAddresses, getRandomColor } from "../../../helpers/Helpers";
import Image from "next/image";
import Address from "../../address/Address";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import DotLoader from "../../dotLoader/DotLoader";

interface Props {
  user: string;
  wallets: string[];
}

const ACCEPTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ACCEPTED_FORMATS_DISPLAY = ACCEPTED_FORMATS.map(
  (format) => `.${format.replace("image/", "")}`
).join(", ");

const FILE_SIZE_LIMIT = 10485760;

export default function UserSettingsComponent(props: Props) {
  const account = useAccount();
  const [ens, setEns] = useState<ENS>();

  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<any>();
  const [bgColor1, setBgColor1] = useState<string>();
  const [bgColor2, setBgColor2] = useState<string>();
  const [website, setWebsite] = useState<string>();

  const [processing, setProcessing] = useState(false);
  const [fetching, setFetching] = useState(true);

  function submit() {
    alert("submit");
    setProcessing(true);
  }

  const handleUpload = () => {
    (inputRef.current as any).click();
  };

  const handleDrag = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  function isValidImage(file: any) {
    if (ACCEPTED_FORMATS.indexOf(file.type) === -1) {
      return false;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      return false;
    }
    return true;
  }

  function getFileSize() {
    const fileSize = file.size;
    if (fileSize < 1024) return <>{fileSize} B</>;
    else if (fileSize >= 1024 && fileSize < 1048576) {
      return <>{(file.size / 1024).toFixed(0)} KB</>;
    } else {
      return <>{(file.size / 1048576).toFixed(0)} MB</>;
    }
  }

  const handleDrop = async function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0] &&
      isValidImage(e.dataTransfer.files[0])
    ) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    async function fetch() {
      if (props.user.startsWith("0x") || props.user.endsWith(".eth")) {
        const url = `${process.env.API_ENDPOINT}/api/user/${props.user}`;
        return fetchUrl(url).then((response: ENS) => {
          setEns(response);
          setBgColor1(response.banner_1 ? response.banner_1 : getRandomColor());
          setBgColor2(response.banner_2 ? response.banner_2 : getRandomColor());
          setWebsite(response.website);
          setFetching(false);
        });
      } else {
        setFetching(false);
      }
    }

    fetch();
  }, [account.address]);

  if (fetching) {
    return (
      <Container>
        <Row>
          <Col className="pt-4 text-center">
            Fetching User <DotLoader />
          </Col>
        </Row>
      </Container>
    );
  }

  if (ens && areEqualAddresses(account.address, ens.wallet)) {
    return (
      <>
        <Container>
          <Row className="pt-4 pb-2">
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 10, offset: 1 }}
              lg={{ span: 8, offset: 2 }}>
              <Container className={styles.addressContainer}>
                <Row>
                  <Col>
                    <Tippy
                      content={"Back to user page"}
                      delay={500}
                      placement={"right"}
                      theme={"light"}>
                      <FontAwesomeIcon
                        icon="arrow-circle-left"
                        className={styles.backIcon}
                        onClick={() =>
                          (window.location.href = `/${props.user}`)
                        }
                      />
                    </Tippy>
                    <Address
                      wallets={[ens.wallet as `0x${string}`]}
                      display={ens.display}
                      isUserPage={true}
                      disableLink={true}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-2 pb-4">
          <Row>
            <Col
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 10, offset: 1 }}
              lg={{ span: 8, offset: 2 }}>
              <Container className={styles.toolArea}>
                <Row>
                  <Col
                    xs={12}
                    className="d-flex justify-content-between flex-wrap gap-2">
                    <span>
                      Upload Image{" "}
                      <span className="font-color-h">
                        ({ACCEPTED_FORMATS_DISPLAY})
                      </span>
                    </span>
                    <span>
                      {file ? (
                        <span>
                          {file.name} ({getFileSize()})&nbsp;
                          <span
                            className="font-color-h cursor-pointer decoration-hover-underline"
                            onClick={() => setFile(undefined)}>
                            clear
                          </span>
                        </span>
                      ) : (
                        ""
                      )}
                    </span>
                  </Col>
                  <Col xs={12} className="pt-2">
                    <div
                      className={`${styles.placeholder} ${styles.uploadArea} ${
                        dragActive ? styles.uploadAreaActive : ""
                      }`}
                      onClick={handleUpload}
                      onDrop={handleDrop}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}>
                      {file ? (
                        <Image
                          width="0"
                          height="0"
                          style={{
                            width: "auto",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: "100%",
                          }}
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                        />
                      ) : ens.pfp ? (
                        <Image
                          width="0"
                          height="0"
                          style={{
                            width: "auto",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: "100%",
                          }}
                          src={ens.pfp}
                          alt={ens.wallet}
                        />
                      ) : (
                        <>
                          <div>
                            <FontAwesomeIcon
                              icon="file-upload"
                              className={styles.uploadIcon}
                            />
                          </div>
                          <div>
                            Drag and drop your image here, or click to upload
                          </div>
                        </>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col xs={6}>
                    <Container className="no-padding">
                      <Row>
                        <Col>Background Color 1</Col>
                      </Row>
                      <Row>
                        <Col>
                          <Form.Control
                            className={`${styles.formInput}`}
                            type="color"
                            value={bgColor1}
                            onChange={(e: any) => setBgColor1(e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Container>
                  </Col>
                  <Col xs={6}>
                    <Container>
                      <Row>
                        <Col>Background Color 2</Col>
                      </Row>
                      <Row>
                        <Col>
                          <Form.Control
                            className={`${styles.formInput}`}
                            type="color"
                            value={bgColor2}
                            onChange={(e: any) => setBgColor2(e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Container>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col xs={12}>Website</Col>
                  <Col>
                    <Form.Control
                      placeholder="https://"
                      className={`${styles.formInput}`}
                      type="text"
                      value={website}
                      onChange={(e: any) => setWebsite(e.target.value)}
                    />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Button
                      className={`${styles.submitBtn}`}
                      onClick={() => submit()}>
                      {processing ? "Processing" : "Submit"}
                      {processing && (
                        <div className="d-inline">
                          <div
                            className={`spinner-border ${styles.loader}`}
                            role="status">
                            <span className="sr-only"></span>
                          </div>
                        </div>
                      )}
                    </Button>
                  </Col>
                </Row>
                <Form.Control
                  ref={inputRef}
                  className={`${styles.formInputHidden}`}
                  type="file"
                  accept={ACCEPTED_FORMATS_DISPLAY}
                  value={file?.fileName}
                  onChange={(e: any) => {
                    if (e.target.files) {
                      const f = e.target.files[0];
                      setFile(f);
                    }
                  }}
                />
              </Container>
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  return (
    <Container className="pt-4">
      <Row>
        <Col className="d-flex flex-column align-items-center gap-2">
          <Image
            width="0"
            height="0"
            style={{ height: "auto", width: "100px" }}
            src="/SummerGlasses.svg"
            alt="SummerGlasses"
          />
          <h2>SOMETHING IS NOT RIGHT</h2>
          <a href={`/${props.user}`} className="pt-3">
            BACK TO USER PAGE
          </a>
          <a href="/" className="pt-3">
            TAKE ME HOME
          </a>
        </Col>
      </Row>
    </Container>
  );
}
