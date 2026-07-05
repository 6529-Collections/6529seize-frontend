import FundSzn1ArtworkBlocks from "@/components/museum-fund-szn1/FundSzn1ArtworkBlocks";
import type { FundSzn1Block } from "@/components/museum-fund-szn1/FundSzn1ArtworkBlocks";
import { parseFundSzn1ImageDescriptor } from "@/components/museum-fund-szn1/FundSzn1ArtworkBlocks";

const BLOCKS: readonly FundSzn1Block[] = [
  {
    kind: "tile",
    variant: "half",
    column: 2,
    imageframe: 1,
    titleNumber: 3,
    lightboxHref:
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243-600x600.png",
    lightboxRel: "iLightbox[0bab7ebc3338e09bca9]",
    artworkTitle: "Capsule House 00243",
    heading: <>CAPSULE HOUSE 00243</>,
    fetchPriorityHigh: true,
    image: {
      width: 600,
      height: 600,
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243-600x600.png",
      wpImage: 1517,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243-200x200.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243-400x400.png 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243-600x600.png 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243-800x800.png 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-00243.png 1000w",
      sizes: "(max-width: 640px) 100vw, 600px",
    },
  },
  {
    kind: "tile",
    variant: "half",
    column: 3,
    imageframe: 2,
    titleNumber: 4,
    lightboxHref:
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146-600x600.png",
    lightboxRel: "iLightbox[22c7384a967ca6542b3]",
    artworkTitle: "Capsule House 03146",
    heading: <>CAPSULE HOUSE 03146</>,
    image: {
      width: 600,
      height: 600,
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146-600x600.png",
      wpImage: 1519,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146-200x200.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146-400x400.png 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146-600x600.png 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146-800x800.png 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03146.png 1000w",
      sizes: "(max-width: 640px) 100vw, 600px",
    },
  },
  {
    kind: "tile",
    variant: "half",
    column: 4,
    imageframe: 3,
    titleNumber: 5,
    lightboxHref:
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538-600x600.png",
    lightboxRel: "iLightbox[bf77627acac21a5b26c]",
    artworkTitle: "Capsule House 03538",
    heading: <>CAPSULE HOUSE 03538</>,
    image: {
      width: 600,
      height: 600,
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538-600x600.png",
      wpImage: 1520,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538-200x200.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538-400x400.png 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538-600x600.png 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538-800x800.png 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-03538.png 1000w",
      sizes: "(max-width: 640px) 100vw, 600px",
    },
  },
  {
    kind: "tile",
    variant: "half",
    column: 5,
    imageframe: 4,
    titleNumber: 6,
    lightboxHref:
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785-600x600.png",
    lightboxRel: "iLightbox[196c0715c3c326f74e6]",
    artworkTitle: "Capsule House 07785",
    heading: <>CAPSULE HOUSE 07785</>,
    image: {
      width: 600,
      height: 600,
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785-600x600.png",
      wpImage: 1521,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785-200x200.png 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785-400x400.png 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785-600x600.png 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785-800x800.png 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-07785.png 1000w",
      sizes: "(max-width: 640px) 100vw, 600px",
    },
  },
  {
    kind: "tile",
    variant: "half",
    column: 6,
    imageframe: 5,
    titleNumber: 7,
    lightboxHref:
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-600x600.jpg",
    lightboxRel: "iLightbox[22a041ca27ba8718230]",
    artworkTitle: "Capsule House 01072",
    heading: <>CAPSULE HOUSE 01072</>,
    image: {
      width: 600,
      height: 600,
      src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-600x600.jpg",
      wpImage: 1518,
      srcSet:
        "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-200x200.jpg 200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-400x400.jpg 400w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-600x600.jpg 600w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-800x800.jpg 800w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072-1200x1200.jpg 1200w, https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Capsule-House-01072.jpg 1500w",
      sizes: "(max-width: 640px) 100vw, 600px",
    },
  },
  {
    kind: "carousel",
    column: 7,
    carouselNumber: 1,
    titleNumber: 8,
    caption: <>ZODIAC CAPSULE FULL SET</>,
    items: [
      "Zodiac-Capsule-02754|1000|1000|full|set",
      "Zodiac-Capsule-04133|1000|1000|full|set",
      "Zodiac-Capsule-04322|1000|1000|full|set",
      "Zodiac-Capsule-04669|1000|1000|full|set",
      "Zodiac-Capsule-04951|1000|1000|full|set",
      "Zodiac-Capsule-05099|1000|1000|full|set",
      "Zodiac-Capsule-05104|1000|1000|full|set",
      "Zodiac-Capsule-06114|1000|1000|full|set",
      "Zodiac-Capsule-09589|1000|1000|full|set",
      "Zodiac-Capsule-09666|1000|1000|full|set",
      "Zodiac-Capsule-01966|1000|1000|full|set",
      "Zodiac-Capsule-02541|1000|1000|full|set",
    ].map((d) => parseFundSzn1ImageDescriptor(d, "carousel")),
  },
  {
    kind: "sliderColumn",
    column: 8,
    sliders: [
      [
        "Zodiac-Capsule-09122|400|400|wp1522|set",
        "Zodiac-Capsule-06849|1000|1000|wp1523|full|set",
        "Zodiac-Capsule-05990|1000|1000|wp1524|full|set",
        "Zodiac-Capsule-09656|1000|1000|wp1525|full|set",
        "Zodiac-Capsule-05932|1000|1000|wp1526|full|set",
      ],
      [
        "Zodiac-Capsule-09260|1000|1000|wp1532|full|set",
        "Zodiac-Capsule-08142|1000|1000|wp1533|full|set",
        "Zodiac-Capsule-03028|1000|1000|wp1534|full|set",
        "Zodiac-Capsule-09018|1000|1000|wp1535|full|set",
        "Zodiac-Capsule-05877|1000|1000|wp1536|full|set",
      ],
      [
        "Zodiac-Capsule-08327|1000|1000|wp1542|full|set",
        "Zodiac-Capsule-08297|1000|1000|wp1543|full|set",
        "Zodiac-Capsule-07024|1000|1000|wp1544|full|set",
        "Zodiac-Capsule-04038|1000|1000|wp1545|full|set",
        "Zodiac-Capsule-05235|1000|1000|wp1546|full|set",
      ],
      [
        "Zodiac-Capsule-05189|1000|1000|wp1552|full|set",
        "Zodiac-Capsule-05623|1000|1000|wp1553|full|set",
        "Zodiac-Capsule-00119|1000|1000|wp1554|full|set",
        "Zodiac-Capsule-04448|1000|1000|wp1555|full|set",
        "Zodiac-Capsule-04179|1000|1000|wp1556|full|set",
        "Zodiac-Capsule-08889|1000|1000|wp1557|full|set",
      ],
    ].map((group) =>
      group.map((d) => parseFundSzn1ImageDescriptor(d, "slider"))
    ),
  },
  {
    kind: "sliderColumn",
    column: 9,
    sliders: [
      [
        "Zodiac-Capsule-03552|1000|1000|wp1527|full|set",
        "Zodiac-Capsule-02973|1000|1000|wp1528|full|set",
        "Zodiac-Capsule-06009|1000|1000|wp1529|full|set",
        "Zodiac-Capsule-07570|1000|1000|wp1530|full|set",
        "Zodiac-Capsule-04296|1000|1000|wp1531|full|set",
      ],
      [
        "Zodiac-Capsule-02661|1000|1000|wp1537|full|set",
        "Zodiac-Capsule-03365|1000|1000|wp1538|full|set",
        "Zodiac-Capsule-07104|1000|1000|wp1539|full|set",
        "Zodiac-Capsule-08100|1000|1000|wp1540|full|set",
        "Zodiac-Capsule-07828|1000|1000|wp1541|full|set",
      ],
      [
        "Zodiac-Capsule-02224|1000|1000|wp1547|full|set",
        "Zodiac-Capsule-01999|1000|1000|wp1548|full|set",
        "Zodiac-Capsule-03269|1000|1000|wp1549|full|set",
        "Zodiac-Capsule-01234|1000|1000|wp1550|full|set",
        "Zodiac-Capsule-05912|1000|1000|wp1551|full|set",
      ],
    ].map((group) =>
      group.map((d) => parseFundSzn1ImageDescriptor(d, "slider"))
    ),
  },
];

export default function CapsuleHouseArtworks() {
  return <FundSzn1ArtworkBlocks blocks={BLOCKS} />;
}
