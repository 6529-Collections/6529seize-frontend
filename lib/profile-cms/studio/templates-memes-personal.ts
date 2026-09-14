import {
  ART,
  ART_CAPTIONS,
  SOURCE_LINKS,
  card,
  externalLink,
  gallery,
  heading,
  image,
  kicker,
  page,
  pageLink,
  quote,
  style,
  text,
} from "./template-recipes";
import { memeCredit, memeImage, memeTemplate } from "./meme-template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const MEME_PERSONAL_TEMPLATES: readonly CmsStudioTemplate[] = [
  memeTemplate(1, {
    id: "meme-seizer",
    name: "Seizer",
    siteTitle: "Mira",
    family: "personal",
    description:
      "A personal site for your work, interests and favorite links, with a compact pixel-art layout.",
    presentation: style("signature", "stone", "mono", "compact"),
    accent: "#147d80",
    pages: [
      page(
        "studio",
        "Hi, I’m Mira.",
        "I build small web tools, follow digital art and spend most weekends on my bike.",
        kicker("Projects / Interests / Reading"),
        memeImage(1, "third"),
        text(
          "I’m putting my projects and notes here so they’re easier to find. Lately, I’ve been working on a reading list and learning more about The Memes.",
          "two_thirds"
        ),
        card(
          "On my desk",
          "A browser tool that saves an article with its title, author and a short note.",
          "third"
        ),
        card(
          "Outside work",
          "Bike rides, old maps and finding a good place for lunch along the way.",
          "third"
        ),
        card(
          "Currently reading",
          "Articles about the early web and how artists publish their work online.",
          "third"
        ),
        pageLink("More about my interests", "interests"),
        memeCredit(1)
      ),
      page(
        "interests",
        "What I’m into",
        "Digital art, useful software and getting outside.",
        heading("Art and small projects"),
        text(
          "I like seeing artists post sketches and unfinished work. On 6529, I follow those updates alongside the finished pieces.",
          "half"
        ),
        text(
          "My coding projects usually start with something I find annoying. At the moment, that’s losing track of articles I meant to read.",
          "half"
        ),
        card(
          "The reading-list project",
          "I’m trying a version with just three fields: the link, why I saved it and whether I’ve read it."
        ),
        pageLink("Browse my reading list", "reading-room")
      ),
      page(
        "reading-room",
        "Links I keep using",
        "A few starting points for the subjects on this site.",
        card(
          "Ethereum",
          "The developer documentation is where I start when I want to understand how an Ethereum feature works."
        ),
        externalLink("Read Ethereum documentation", SOURCE_LINKS.ethereum),
        card(
          "The Memes",
          "I use the collection pages to look up a card, find the artist and browse nearby releases."
        ),
        externalLink("Browse The Memes", SOURCE_LINKS.memes),
        pageLink("Back to my introduction", "studio")
      ),
    ],
  }),
  memeTemplate(4, {
    id: "meme-sovereign",
    name: "Sovereign",
    siteTitle: "Sovereign Notebook",
    family: "personal",
    description:
      "A personal blog for crypto interests, software projects and longer posts on a light background.",
    presentation: style("editorial", "paper", "serif", "airy"),
    accent: "#b84a15",
    pages: [
      page(
        "studio",
        "Tools I use. Things I’m learning.",
        "Notes on open-source software, digital art and keeping a copy of my own work.",
        kicker("Sovereign Notebook"),
        memeImage(4, "half"),
        text(
          "I like tools I can understand and files I can move between them. This notebook covers what I’ve tried, what worked and what I still need to figure out.",
          "half"
        ),
        quote(
          "I tried opening last year’s export. Half the image links were broken.",
          "From the backup notes"
        ),
        pageLink("How I choose tools", "principles"),
        pageLink("Read the posts", "essays"),
        memeCredit(4)
      ),
      page(
        "principles",
        "How I choose tools",
        "Three things I check before moving a project into a new app.",
        card(
          "Can I export it?",
          "I want the text, images and links in formats I can open elsewhere.",
          "third"
        ),
        card(
          "What does it depend on?",
          "I check which parts need an account, a paid service or an internet connection.",
          "third"
        ),
        card(
          "Can someone else use it?",
          "For my own projects, I include a short setup guide and the source files.",
          "third"
        ),
        heading("A quick trial"),
        text(
          "Before moving everything, I try one small project. I export it, open the files and check what is missing."
        ),
        pageLink("Read my backup notes", "essays")
      ),
      page(
        "essays",
        "Testing an old website backup",
        "What I found when I opened an export I hadn’t checked in a year.",
        heading("The missing images"),
        text(
          "The text was there, but some images still pointed to the old site. I had saved a list of links, not the files behind them."
        ),
        text(
          "My next backup includes the image files and a list of where they belong. I’m also keeping a copy of the published pages so I can check the result."
        ),
        externalLink("Read the IPFS documentation", SOURCE_LINKS.ipfs),
        pageLink("Back to choosing tools", "principles")
      ),
    ],
  }),
  memeTemplate(8, {
    id: "meme-gm-journal",
    name: "GM Journal",
    siteTitle: "Mira’s Mornings",
    family: "personal",
    description:
      "A simple dark journal for short posts, daily updates and an archive of earlier entries.",
    presentation: style("journal", "ink", "sans", "airy"),
    accent: "#d0d0d0",
    pages: [
      page(
        "studio",
        "GM. Coffee’s on.",
        "A few notes from Mira’s mornings: bike rides, small projects and whatever else happened.",
        kicker("Entry 001 / The bakery route"),
        text(
          "I took the longer route to the bakery this morning. They’d sold out of the bread I wanted, so I came home with two cinnamon buns. I’m calling that a successful trip."
        ),
        pageLink("Earlier entries", "archive"),
        heading("FirstGM"),
        memeImage(8, "half"),
        memeCredit(8)
      ),
      page(
        "archive",
        "Earlier mornings",
        "Short updates from the same notebook.",
        card(
          "003 / A puncture",
          "Ten minutes into the ride, the rear tire went flat. The spare tube was the wrong size. Walked home, made coffee."
        ),
        card(
          "002 / A project name",
          "We spent an hour naming the reading-list tool. It still doesn’t save links. The name can wait."
        ),
        card(
          "001 / The bakery route",
          "No bread left, two cinnamon buns acquired. A good start."
        ),
        pageLink("About this journal", "about")
      ),
      page(
        "about",
        "About Mira’s Mornings",
        "I’m Mira. I like bikes, coffee and posting a quick GM before work.",
        text(
          "I wanted a place for the short updates I usually forget to keep. Some entries are about projects; others are just what happened before breakfast."
        ),
        quote("I’ll write another entry when I have something to add.", "Mira"),
        text(
          "FirstGM is the card I chose for the site. You can find its artist credit and collection page beside the image."
        ),
        pageLink("Read the latest entry", "studio")
      ),
    ],
  }),
  memeTemplate(47, {
    id: "meme-exit-signal",
    name: "Exit Signal",
    siteTitle: "Exit Signal",
    family: "collector",
    description:
      "A dark collector gallery with large artwork, a selection page and notes about each choice.",
    presentation: style("gallery", "night", "mono", "compact"),
    accent: "#eb7ca8",
    pages: [
      page(
        "studio",
        "Digital art I keep coming back to",
        "A few favorite works, with notes on why I chose them.",
        kicker("Artwork / Artists / Collection notes"),
        memeImage(47, "two_thirds"),
        text(
          "I use this page to keep a few favorites together. The selection changes as I find new artists or return to a work I haven’t looked at for a while.",
          "third"
        ),
        pageLink("View the selection", "selection"),
        pageLink("Read the collection notes", "signal-log"),
        memeCredit(47)
      ),
      page(
        "selection",
        "The selection",
        "Night Grid, Afterimage and Quiet Signal.",
        image(ART.grid, ART_CAPTIONS.grid, "third"),
        image(ART.afterimage, ART_CAPTIONS.afterimage, "two_thirds"),
        image(ART.signal, ART_CAPTIONS.signal, "half"),
        card(
          "Why these three",
          "I started with the yellow lights in Night Grid, then added the orange backdrop of Afterimage. Quiet Signal gives me something lighter to look at after those two."
        ),
        pageLink("How I choose what goes here", "signal-log")
      ),
      page(
        "signal-log",
        "Collection notes",
        "Why I saved a work, where I found it and what I want to see next.",
        kicker("Entry 01 / Choosing a few favorites"),
        text(
          "I started with too many images for one page. I’ve cut the first selection down to three and moved the rest to a list to revisit."
        ),
        quote(
          "I’d like to see more work by this artist before adding another piece.",
          "Collection notebook"
        ),
        text(
          "For each addition, I keep the title, artist and source link. If I include an NFT I own, I add its token details separately."
        ),
        pageLink("Back to the selection", "selection")
      ),
    ],
  }),
  memeTemplate(59, {
    id: "meme-good-morning",
    name: "Good Morning",
    siteTitle: "Morning Cabinet",
    family: "collector",
    description:
      "A casual collector site for favorite artwork, Meme cards and short daily posts.",
    presentation: style("signature", "ink", "sans", "balanced"),
    accent: "#9bdb63",
    pages: [
      page(
        "studio",
        "GM from Morning Cabinet",
        "A few favorite images and a notebook that usually gets updated over coffee.",
        memeImage(59, "half"),
        text(
          "I save art that makes me laugh, catches my eye or sends me looking for more by the same artist. This is a small selection, with notes alongside it.",
          "half"
        ),
        card(
          "On the list",
          "Go back through the cards I bookmarked and pick three for the next update."
        ),
        pageLink("Browse my favorites", "favorites"),
        pageLink("Read the morning posts", "mornings"),
        memeCredit(59)
      ),
      page(
        "favorites",
        "Current favorites",
        "An orange backdrop, a map of lights and fine blue lines.",
        gallery("Three favorites", [ART.afterimage, ART.grid, ART.signal]),
        card(
          "Afterimage",
          "The reflective loop against orange caught my eye immediately. I like following the bright edge around the bend.",
          "third"
        ),
        card(
          "Night Grid",
          "Yellow and green lights cross a nearly black grid. I keep following the bright diagonal from one corner to the other.",
          "third"
        ),
        card(
          "Quiet Signal",
          "Fine blue curves on a cream background, with a little red at the lower right. I like how much detail there is in such a simple palette.",
          "third"
        ),
        pageLink("Read the latest posts", "mornings")
      ),
      page(
        "mornings",
        "This week’s notes",
        "A couple of updates from the morning notebook.",
        kicker("Monday / Too many bookmarks"),
        text(
          "I opened my saved links and found the same artwork three times. I’m going to put the artist’s name next to the link from now on."
        ),
        kicker("Wednesday / Studio photos"),
        text(
          "An artist I follow posted photos of their desk and sketchbook. I spent longer looking at those than I meant to."
        ),
        pageLink("Back to my favorites", "favorites")
      ),
    ],
  }),
  memeTemplate(375, {
    id: "meme-quiet-growth",
    name: "Quiet Growth",
    siteTitle: "Quiet Growth Library",
    family: "collector",
    description:
      "A collector’s library for artwork, reading lists and personal notes, with a soft stone background.",
    presentation: style("editorial", "stone", "serif", "airy"),
    accent: "#626b45",
    pages: [
      page(
        "studio",
        "Art and reading from my desk",
        "Digital artwork, nature writing and notes from my reading list.",
        memeImage(375, "half"),
        text(
          "I keep artwork and reading lists here because I often find one through the other. At the moment, I’m interested in drawing, generative art and field guides.",
          "half"
        ),
        quote(
          "I bought the field guide to identify one tree. Now it comes on every walk.",
          "Library notebook"
        ),
        pageLink("Browse the library", "library"),
        pageLink("Read my notes", "marginalia"),
        memeCredit(375)
      ),
      page(
        "library",
        "On the shelves",
        "Three subjects I’m reading about at the moment.",
        card(
          "Drawing",
          "Artist sketchbooks, drawing exercises and notes on materials.",
          "third"
        ),
        card(
          "Generative art",
          "Artist interviews and explanations of the code behind individual works.",
          "third"
        ),
        card(
          "Plants and places",
          "Field guides, walking maps and books about local habitats.",
          "third"
        ),
        image(ART.signal, ART_CAPTIONS.signal),
        pageLink("Notes from the desk", "marginalia")
      ),
      page(
        "marginalia",
        "Library notes",
        "Short updates about what I’m reading and adding.",
        heading("The field guide"),
        text(
          "I’ve started writing down where I see each plant, rather than trying to remember it later. So far, the notebook is mostly corrections."
        ),
        heading("An artist’s reading list"),
        text(
          "An interview led me to a book on drawing that I hadn’t heard of. I’ve added it to the list and will write more once I’ve read it."
        ),
        pageLink("Back to the library", "library")
      ),
    ],
  }),
];
