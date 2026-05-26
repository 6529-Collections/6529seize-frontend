import DotLoader from "@/components/dotLoader/DotLoader";
import NFTImage from "@/components/nft-image/NFTImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import type { NFT } from "@/entities/INFT";
import { Col, Container, Row } from "react-bootstrap";

export function printMemeReferences(
  memes: NFT[],
  routerPath: string,
  memesLoaded: boolean = true,
  hideTitle: boolean = false
) {
  return (
    <Row className="pt-2">
      {!hideTitle && (
        <Col xs={12} className="pt-2">
          <h1>The Memes References</h1>
        </Col>
      )}
      {memesLoaded ? (
        <>
          {memes.length > 0 ? (
            <>
              {memes.map((nft) => {
                return (
                  <Col
                    key={`${nft.contract}-${nft.id}`}
                    className="py-3"
                    xs={{ span: 6 }}
                    sm={{ span: 4 }}
                    md={{ span: 3 }}
                    lg={{ span: 3 }}
                  >
                    <a
                      href={`/${routerPath}/${nft.id}`}
                      className="decoration-none scale-hover"
                    >
                      <Container fluid className="no-padding">
                        <Row>
                          <Col>
                            <NFTImage
                              nft={nft}
                              animation={false}
                              height={300}
                              showBalance={false}
                              showThumbnail={true}
                            />
                          </Col>
                        </Row>
                        <Row>
                          <Col className="text-center pt-2">
                            <b>
                              #{nft.id} - {nft.name}
                            </b>
                          </Col>
                        </Row>
                        <Row>
                          <Col className="text-center pt-2">
                            Artist Name: {nft.artist}
                          </Col>
                        </Row>
                        <Row>
                          <Col className="text-center pt-2">
                            Artist Profile: <ArtistProfileHandle nft={nft} />
                          </Col>
                        </Row>
                      </Container>
                    </a>
                  </Col>
                );
              })}
            </>
          ) : (
            <Col>
              <NothingHereYetSummer />
            </Col>
          )}
        </>
      ) : (
        <Col>
          Fetching references <DotLoader />
        </Col>
      )}
    </Row>
  );
}

export function RememeReferencesGrid({ memes }: { readonly memes: NFT[] }) {
  return (
    <section className="tw-space-y-5 tw-pb-5">
      <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200">
        The Memes References
      </h2>
      {memes.length > 0 ? (
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 sm:tw-grid-cols-3 md:tw-grid-cols-4">
          {memes.map((nft) => (
            <a
              href={`/the-memes/${nft.id}`}
              className="tw-group tw-min-w-0 tw-text-iron-200 tw-no-underline"
              key={`${nft.contract}-${nft.id}`}
            >
              <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-transition-colors group-hover:tw-border-iron-600">
                <div>
                  <NFTImage
                    nft={nft}
                    animation={false}
                    height={300}
                    showBalance={false}
                    showThumbnail={true}
                  />
                </div>
                <div className="tw-space-y-2 tw-p-3 tw-text-center">
                  <div className="tw-line-clamp-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 group-hover:tw-text-white">
                    #{nft.id} - {nft.name}
                  </div>
                  <div className="tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
                    Artist Name: {nft.artist}
                  </div>
                  <div className="tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400 [&_a]:tw-text-iron-200 [&_a]:tw-no-underline hover:[&_a]:tw-text-white">
                    Artist Profile: <ArtistProfileHandle nft={nft} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <NothingHereYetSummer />
      )}
    </section>
  );
}
