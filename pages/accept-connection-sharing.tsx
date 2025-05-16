import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../components/auth/Auth";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useRouter } from "next/router";
import Link from "next/link";
import { areEqualAddresses } from "../helpers/Helpers";
import { setAuthJwt } from "../services/auth/auth.utils";
import { commonApiPost } from "../services/api/common-api";
import { Spinner } from "../components/dotLoader/DotLoader";
import { useSeizeConnectContext } from "../components/auth/SeizeConnectContext";
import { ApiRedeemRefreshTokenRequest } from "../generated/models/ApiRedeemRefreshTokenRequest";
import { ApiRedeemRefreshTokenResponse } from "../generated/models/ApiRedeemRefreshTokenResponse";

interface AcceptConnectionSharingProps {
  token: string;
  address: string;
  role?: string;
}

export default function AcceptConnectionSharing(
  props: Readonly<{
    pageProps: AcceptConnectionSharingProps;
  }>
) {
  const { setTitle, setToast } = useContext(AuthContext);
  const {
    address: connectedAddress,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
  } = useSeizeConnectContext();

  const router = useRouter();

  const { token, address, role } = props.pageProps;

  const [acceptingConnection, setAcceptingConnection] = useState(false);

  useEffect(() => {
    setTitle({
      title: "Accept Connection Sharing",
    });
  }, []);

  const acceptConnection = async () => {
    try {
      const redeemResponse = await commonApiPost<
        ApiRedeemRefreshTokenRequest,
        ApiRedeemRefreshTokenResponse
      >({
        endpoint: "auth/redeem-refresh-token",
        body: {
          address,
          token,
        },
      });
      if (
        redeemResponse.address &&
        redeemResponse.token &&
        areEqualAddresses(redeemResponse.address, address)
      ) {
        setAuthJwt(
          redeemResponse.address,
          redeemResponse.token,
          token,
          role ?? undefined
        );
        seizeAcceptConnection(redeemResponse.address);
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to accept connection",
        type: "error",
      });
      setAcceptingConnection(false);
    }
  };

  return (
    <main className="tw-min-h-[100dvh] tw-bg-iron-950">
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h1>
              <span className="font-lightest">Accept</span> Connection Sharing
            </h1>
          </Col>
        </Row>
        <Row className="pt-5">
          {!token || !address ? (
            <Col>
              <p className="font-larger">Missing required parameters</p>
              <p className="pt-3">
                <Link href="/">TAKE ME HOME</Link>
              </p>
            </Col>
          ) : (
            <>
              <Col sm={12} md={6}>
                <h4>Incoming Connection</h4>
                <p className="pt-3">
                  Token: {token.substring(0, 8)}...$
                  {token.substring(token.length - 7)}
                </p>
                <p>Address: {address}</p>
              </Col>
              <Col
                sm={12}
                md={6}
                className="d-flex flex-column align-items-center justify-content-center">
                {connectedAddress && !acceptingConnection ? (
                  <>
                    <p className="text-center">
                      Existing connection detected, disconnect first!
                    </p>
                    <Button
                      size="lg"
                      onClick={() => seizeDisconnectAndLogout()}>
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className="d-flex align-items-center justify-content-center gap-2"
                    onClick={() => {
                      setAcceptingConnection(true);
                      acceptConnection();
                    }}>
                    {acceptingConnection ? (
                      <>
                        PROCESSING <Spinner dimension={18} />
                      </>
                    ) : (
                      "ACCEPT CONNECTION"
                    )}
                  </Button>
                )}
              </Col>
            </>
          )}
        </Row>
      </Container>
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const { token, address, role } = req.query;

  const props: AcceptConnectionSharingProps = {
    token,
    address,
  };
  if (role) {
    props.role = role;
  }
  return {
    props,
  };
}

AcceptConnectionSharing.metadata = {
  title: "Accept Connection Sharing",
};
