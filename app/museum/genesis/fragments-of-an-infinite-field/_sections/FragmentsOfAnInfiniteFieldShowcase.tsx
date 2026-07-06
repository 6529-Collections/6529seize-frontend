import GenesisTokenShowcase from "@/components/museum-genesis/GenesisTokenShowcase";

/**
 * The ten showcase pairs of the /museum/genesis/fragments-of-an-infinite-field page as
 * genesis showcase descriptors
 * (`media|tokenLine|keyTraits|rarity|flags|caption` — grammar documented
 * in GenesisTokenShowcase). Extracted verbatim from the WP scrape and
 * round-trip-asserted against every captured attribute before the page
 * was rewritten to render through the shared module.
 */
const PAIRS: readonly string[] = [
  "933@1082@c1e6a339bd19f196a3d|Token: 933|Storm: Yes;Flowers: 37;Rain: Yes|2/1024 RG;2/1024 AR;2/1024 ASR|hi|The second rarest Fragments and arguably the most beautiful rare Fragment.",
  "185@1087@88db9fbe8b0251121f4|Token: 185|Storm: Yes;Flowers: 52;Rain: Yes|16/1024 RG;16/1024 AR;16/1024 ASR||As with 933, another Fragment of the rarest type (summer, storm).",
  "988@1086@8011019c8f00d0d9775|Token: 988|Flowers: 13;PetalsFallingDown: Yes;Seasons: Autumn|129/1024 AR;168/1024 RG;174/1024 ASR|cols6|988 captures full seasonality (season: Autumn: Autumn; Petals Falling Down)",
  "72@1085@632d466a2349622f4d1|Token: 72|Flowers: 13;Rain: Yes;Seasons: Summer|157/1024 AR;207/1024 ASR;236/1024 RG|rabr|A colorful summer rain, Fragments of the classic style.",
  "714@1081@93559f540059ab5fbf8|Token: 714|Flowers: 68;PetalsFallingDown: Yes;Seasons: Autumn|171/1024 AR;226/1024 RG;275/1024 ASR||714 is another Petals Falling Down Fall Fragment.",
  "466@1083@8cc52cd93f34f70b669|Token: 466|Flowers: 44;Rain: Yes;Seasons: Summer|307/1024 AR;450/1024 ASR;455/1024 RG||466 is a classic Summer Rain Fragment.",
  "465@1084@c2a17b7317c696af915|Token: 465|Flowers: 52;Snow: Yes;FlowerColor: Equal|436/1024 RG;464/1024 ASR;492/1024 AR||465 is a classic Winter Snow Fragment.",
  "243@1088@131009ca5a47557e726|Token: 243|Flowers: 29;Pollen: Yes;Seasons: Spring|540/1024 AR;560/1024 ASR;560/1024 ASR||243 is a classic Spring Pollen Yes.",
  "880@1089@a164e08888781f6d0ab|Token: 880|Flowers: 52;Snow: Yes;Seasons: Winter|854/1024 RG;866/1024 ASR;879/1024 AR||As with 465, 880 is another Classic Winter Snow.",
  "203@1090@f10e40e96a05d1e4c0d|Token: 203|Flowers: 52;Seasons: Spring;NumberOfPetals: Different|1018/1024 AR;1018/1024 ASR;1023/1024 RG||203 is a Spring Pollen No Pollen with sharper definition.",
];

export default function FragmentsOfAnInfiniteFieldShowcase() {
  return <GenesisTokenShowcase kind="fragmentsImage" pairs={PAIRS} />;
}
