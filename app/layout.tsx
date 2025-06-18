import "@/styles/seize-bootstrap.scss";
import "@/styles/globals.scss";
import "@/styles/swiper.scss";
import "@/components/drops/create/lexical/lexical.styles.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import Providers from "@/components/providers/Providers";
import { getAppMetadata } from "@/components/providers/metadata";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import StoreSetup from "@/components/providers/StoreSetup";

export const metadata = getAppMetadata({});

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreSetup>
          <Providers>
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
        </StoreSetup>
      </body>
    </html>
  );
}
