"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiRedeemRefreshTokenRequest } from "@/generated/models/ApiRedeemRefreshTokenRequest";
import type { ApiRedeemRefreshTokenResponse } from "@/generated/models/ApiRedeemRefreshTokenResponse";
import { areEqualAddresses } from "@/helpers/Helpers";
import { commonApiPost } from "@/services/api/common-api";
import { setAuthJwt } from "@/services/auth/auth.utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";

interface AcceptConnectionSharingProps {
  token: string;
  address: string;
  role?: string | undefined;
}

function AcceptConnectionSharing(
  props: Readonly<AcceptConnectionSharingProps>
) {
  const router = useRouter();
  const { setToast } = useAuth();
  const {
    seizeAcceptConnection,
    seizeDisconnectAndLogout,
    address: connectedAddress,
  } = useSeizeConnectContext();

  const { token, address, role } = props;
  const [acceptingConnection, setAcceptingConnection] = useState(false);

  useSetTitle("Accept Connection Sharing");

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
      setToast({ message: "Failed to accept connection", type: "error" });
      setAcceptingConnection(false);
    }
  };

  return (
    <main className="tw-min-h-[100dvh] tw-bg-iron-950">
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h1>Accept Connection Sharing</h1>
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
                  Token:{" "}
                  {`${token.substring(0, 8)}...${token.substring(
                    token.length - 7
                  )}`}
                </p>
                <p>Address: {address}</p>
              </Col>
              <Col
                sm={12}
                md={6}
                className="d-flex flex-column align-items-center justify-content-center"
              >
                {connectedAddress && !acceptingConnection ? (
                  <>
                    <p className="text-center">
                      Existing connection detected, disconnect first!
                    </p>
                    <Button
                      size="lg"
                      onClick={() => seizeDisconnectAndLogout()}
                    >
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
                    }}
                  >
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

export default function AcceptConnectionSharingPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const address = searchParams?.get("address") || "";
  const role = searchParams?.get("role") || undefined;
  return (
    <AcceptConnectionSharing token={token} address={address} role={role} />
  );
}
