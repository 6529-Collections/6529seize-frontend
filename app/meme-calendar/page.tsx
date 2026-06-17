import MemesMintingCalendar from "@/components/meme-calendar/MemesMintingCalendar";
import { getAppMetadata } from "@/components/providers/metadata";
import { normalizeLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

type MemeCalendarPageSearchParams = Promise<{
  readonly locale?: string | string[] | undefined;
}>;

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Calendar" });
}

function getFirstSearchParamValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MemesMintingCalendarPage({
  searchParams,
}: {
  readonly searchParams: MemeCalendarPageSearchParams;
}) {
  const { locale } = await searchParams;
  const resolvedLocale = normalizeLocale(getFirstSearchParamValue(locale));

  return (
    <Container className="tw-pb-8 tw-pt-6">
      <Row>
        <Col>
          <MemesMintingCalendar locale={resolvedLocale} />
        </Col>
      </Row>
    </Container>
  );
}
