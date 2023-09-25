import { useEffect, useRef, useState } from "react";
import styles from "./UserSettings.module.scss";
import { fetchUrl, postFormData } from "../../../services/6529api";
import { ENS } from "../../../entities/IENS";
import { Button, Col, Container, Dropdown, Form, Row } from "react-bootstrap";
import { useAccount, useSignMessage } from "wagmi";
import {
  areEqualAddresses,
  formatAddress,
  getRandomColor,
} from "../../../helpers/Helpers";
import Image from "next/image";
import Address from "../../address/Address";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import DotLoader from "../../dotLoader/DotLoader";
import { DBResponse } from "../../../entities/IDBResponse";
import { NFTLite } from "../../../entities/INFT";

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

const isDivInViewport = (divRef: any) => {
  if (divRef.current) {
    const rect = divRef.current.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }
  return false;
};

const scrollToDiv = (divRef: any) => {
  if (divRef.current) {
    divRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }
};

export default function UserSettingsComponent(props: Props) {
  const statusDivRef = useRef(null);

  const account = useAccount();
  const signMessage = useSignMessage();

  const [ens, setEns] = useState<ENS>();

  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<any>();
  const [selectedMeme, setSelectedMeme] = useState<NFTLite>();
  const [bgColor1, setBgColor1] = useState<string>();
  const [bgColor2, setBgColor2] = useState<string>();
  const [website, setWebsite] = useState<string>();

  const [processing, setProcessing] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [success, setSuccess] = useState(false);
  const [signErrors, setSignErrors] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string>();

  const [nfts, setNfts] = useState<NFTLite[]>([]);

  useEffect(() => {
    if (!isDivInViewport(statusDivRef)) {
      scrollToDiv(statusDivRef);
    }
  }, [processing]);

  function submit() {
    setProcessing(true);
    setSuccess(false);
    setSignErrors([]);
    signMessage.signMessage({
      message: JSON.stringify(buildUserObject()),
    });
  }

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/memes_lite`).then(
      (response: DBResponse) => {
        setNfts(response.data);
      }
    );
  }, []);

  useEffect(() => {
    if (signMessage.isError) {
      setProcessing(false);
      setSignErrors([`Error: ${signMessage.error?.message.split(".")[0]}`]);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data && ens) {
      const formData = new FormData();
      if (file) {
        formData.append("pfp", file);
      }
      formData.append("wallet", ens.wallet);
      formData.append("signature", signMessage.data);
      formData.append("user", JSON.stringify(buildUserObject()));

      postFormData(`${process.env.API_ENDPOINT}/api/user`, formData).then(
        (response) => {
          const success = response.status === 200;
          setProcessing(false);
          if (success) {
            setSuccess(true);
          } else {
            setSignErrors([`Error: ${response.response.error}`]);
          }
        }
      );
    }
  }, [signMessage.data]);

  useEffect(() => {
    if (success && ens) {
      window.location.href = `/${ens.display ? ens.display : ens.wallet}`;
    }
  }, [success]);

  function buildUserObject() {
    return {
      pfp: file ? file.name : null,
      meme: selectedMeme ? selectedMeme.id : null,
      banner_1: bgColor1,
      banner_2: bgColor2,
      website: website ? website : null,
    };
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

  function validateImage(file: File) {
    if (ACCEPTED_FORMATS.indexOf(file.type) === -1) {
      setFileError("Invalid file type");
    } else if (file.size > FILE_SIZE_LIMIT) {
      setFileError("File size must be less than 10MB");
    } else {
      setFile(file);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateImage(e.dataTransfer.files[0]);
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

  useEffect(() => {
    if (selectedMeme) {
      setFile(undefined);
    }
  }, [selectedMeme]);

  useEffect(() => {
    if (file) {
      setSelectedMeme(undefined);
    }
  }, [file]);

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
                          (window.location.href = `/${
                            ens.display ? ens.display : ens.wallet
                          }`)
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
                    className="d-flex align-items-center justify-content-between">
                    <span>Select Meme</span>
                    {selectedMeme && (
                      <span
                        className="font-color-h cursor-pointer decoration-hover-underline"
                        onClick={() => setSelectedMeme(undefined)}>
                        clear
                      </span>
                    )}
                  </Col>
                  <Col xs={12}>
                    <Dropdown
                      className={styles.memesDropdown}
                      drop={"down-centered"}>
                      <Dropdown.Toggle>
                        {selectedMeme
                          ? `#${selectedMeme.id} - ${selectedMeme.name}`
                          : "-"}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item disabled>-</Dropdown.Item>
                        {nfts.map((m) => (
                          <Dropdown.Item
                            key={`meme-${m.id}`}
                            onClick={() => {
                              setSelectedMeme(m);
                            }}>
                            #{m.id} - {m.name}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                </Row>
                <Row className="pt-4 pb-4 text-center">
                  <Col>
                    <div className={styles.orBlock}>
                      <span>
                        <b>OR</b>
                      </span>
                    </div>
                  </Col>
                </Row>
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
                      ) : fileError ? (
                        <span className={styles.error}>{fileError}</span>
                      ) : (
                        <></>
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
                      {selectedMeme ? (
                        <Image
                          priority
                          loading="eager"
                          width="0"
                          height="0"
                          style={{
                            width: "auto",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: "100%",
                          }}
                          src={selectedMeme.thumbnail}
                          alt={selectedMeme.name}
                        />
                      ) : file ? (
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
                          priority
                          loading="eager"
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
                {success && (
                  <Row className="pt-4 pb-2">
                    <Col
                      className={`${styles.success} d-flex align-items-center gap-2`}>
                      <FontAwesomeIcon
                        icon="check-circle"
                        className={styles.statusIcon}
                      />
                      <span>Profile Updated Successfully!</span>
                    </Col>
                  </Row>
                )}
                {signMessage.isLoading && (
                  <Row className="pt-4 pb-2" ref={statusDivRef}>
                    <Col>
                      Confirm in your wallet <DotLoader />
                    </Col>
                  </Row>
                )}
                {signErrors.length > 0 && (
                  <Row className="pt-4 pb-2">
                    {signErrors.map((e, index) => (
                      <Col
                        key={`${index}-${e}`}
                        xs={12}
                        className={`${styles.error} d-flex align-items-center gap-2`}>
                        <FontAwesomeIcon
                          icon="times-circle"
                          className={styles.statusIcon}
                        />
                        {e}
                      </Col>
                    ))}
                  </Row>
                )}
                <Form.Control
                  ref={inputRef}
                  className={`${styles.formInputHidden}`}
                  type="file"
                  accept={ACCEPTED_FORMATS_DISPLAY}
                  value={file?.fileName}
                  onChange={(e: any) => {
                    if (e.target.files) {
                      const f = e.target.files[0];
                      validateImage(f);
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
          <h2>YOU HAVE NO POWER HERE</h2>
          <a href={`/${props.user}`} className="pt-3">
            BACK TO{" "}
            {props.user.endsWith(".eth")
              ? props.user.toUpperCase()
              : formatAddress(props.user)}
          </a>
          <a href="/" className="pt-3">
            TAKE ME HOME
          </a>
        </Col>
      </Row>
    </Container>
  );
}
