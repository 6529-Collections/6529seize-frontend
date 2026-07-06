import GenesisTokenShowcase from "@/components/museum-genesis/GenesisTokenShowcase";

/**
 * The ten showcase pairs of the /museum/genesis/jiometory-no-compute page as
 * genesis showcase descriptors
 * (`media|tokenLine|keyTraits|rarity|flags|caption` — grammar documented
 * in GenesisTokenShowcase). Extracted verbatim from the WP scrape and
 * round-trip-asserted against every captured attribute before the page
 * was rewritten to render through the shared module.
 */
const PAIRS: readonly string[] = [
  "yWLEgYFb/s5_jiometory_655.mp4|Token: 655|LUTS_TYPE: TURQUOISE;COLOR_MODE: Mono;GLITCH_TYPE: CyberGlitch|1/1024 ASR;1/1024 RG;7/1024 AR||This output features a ‘Diamond' geometry type trait along with a ‘Mono' color mode.",
  "Jr1dLLyh/s5_jiometory_281.mp4|Token: 281|LUTS_TYPE: SCIFI;COLOR_MODE: Earth;GLITCH_TYPE: CyberGlitch|3/1024 AR;18/1024 RG;18/1024 ASR||The ‘Sci-Fi' Luts trait gives an impression of an abstract winged creature taking off.",
  "1X92hHzv/s5_jiometory_546.mp4|Token: 546|LUTS_TYPE: SCIFI;COLOR_MODE: Mint;GLITCH_TYPE: Glitch|6/1024 RG;6/1024 ASR;46/1024 AR||Ranked 6 in rarity and is comprised of symmetric lines of perpetually moving pixelated lines.",
  "aQvsVNGf/s5_jiometory_627.mp4|Token: 627|TWOD: TRUE;COLOR_MODE: Purple;BACKGROUND: FALSE|8/1024 AR;43/1024 RG;43/1024 ASR||Dark blue and purple colors jump around and move in perpetual motion.",
  "bhaiiSD0/s5_jiometory_715.mp4|Token: 715|COLOR_MODE: Arctic;GLITCH_TYPE: HyperGlitch;VERTICAL: TRUE|21/1024 ASR;21/1024 RG;76/1024 AR||This output boasts a ‘Hyperglitch' type and the ‘Artic' color mode.",
  "Jw8uIIpj/s5_jiometory_842.mp4|Token: 842|LUTS_TYPE: TURQUOISE;COLOR_MODE: Patchwork;GLITCH_TYPE: CyberGlitch|38/1024 RG;38/1024 ASR;70/1024 AR||This odd-looking output gets its peculiar look primarily from the ‘Cyberglitch' glitch trait.",
  "Iy4T7EQR/s5_jiometory_166.mov|Token: 166|LUTS_TYPE: GOLD;COLOR_MODE: Cream;GHOST: TRUE|73/1024 RG;73/1024 ASR;89/1024 AR||A definite specimen of the simplistic beauty of Jiometory with intense orange hues.",
  "QuLBlqSf/s5_jiometory_845.mp4|Token: 845|GLITCH_TYPE: HyperGlitch;COLOR_MODE: Robot;FLOOR_TYPE: SQUARE|108/1024 AR;145/1024 ASR;148/1024 RG||Intriguing ‘Hyperglitch' and ‘Symmetric' traits along with the ‘Robot' color mode.",
  "7tboGJmP/s5_jiometory_303.mp4|Token: 303|COLOR_MODE: NightFall;GEOMETRY_TYPE: Diamond;OFFSET: FALSE|374/1024 AR;466/1024 RG;470/1024 ASR||The ‘Nightfall' color mode and simple layout of this output gives it strong cyberpunk vibes.",
  "DEmMn4YK/s5_jiometory_633.mp4|Token:633|COLOR_MODE: Straw;BACKGROUND: FALSE;FLOOR_TYPE: CIRCLE|823/1024 AR;928/1024 RG;928/1024 ASR||‘Circle' floor type trait captures your attention with vivid golden, orange and reds.",
];

export default function JiometoryNoComputeShowcase() {
  return <GenesisTokenShowcase kind="video" pairs={PAIRS} />;
}
