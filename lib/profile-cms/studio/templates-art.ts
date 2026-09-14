import {
  ART,
  ART_CAPTIONS,
  SOURCE_LINKS,
  card,
  defineTemplate,
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
import { memeCredit, memeImage } from "./meme-template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export const ART_TEMPLATES: readonly CmsStudioTemplate[] = [
  defineTemplate({
    id: "memes-collection",
    name: "The Memes Collection",
    siteTitle: "Meme Notes",
    family: "collector",
    description:
      "A collector's selection of The Memes with themes, notes and artist credits.",
    presentation: style("gallery", "night", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Four cards from The Memes",
        "My starting selection: FirstGM, NakamotoFreedom, Sgt. Pepe and SeizeJPGs. Each card links back to its collection record.",
        memeImage(8, "half"),
        heading("Why these four?"),
        text(
          "I wanted a small selection that I could explain to a friend. It starts with a greeting, then moves to freedom, a familiar meme character and collecting images. The notes are my reading of the works, not the artists' statements."
        ),
        pageLink("Collecting notes", "notes"),
        pageLink("View the selection", "themes"),
        memeCredit(8),
        externalLink("Browse The Memes", SOURCE_LINKS.memes)
      ),
      page(
        "themes",
        "The selection",
        "Four credited works grouped around greetings, freedom and digital culture.",
        heading("Freedom and participation"),
        memeImage(4, "two_thirds"),
        text(
          "NakamotoFreedom is my starting point for this group. I keep the title and source beside the image so readers can follow the card's own record before reading my notes.",
          "third"
        ),
        memeCredit(4),
        heading("Greetings and digital culture"),
        memeImage(37, "half"),
        memeImage(2, "half"),
        memeCredit(37),
        memeCredit(2),
        pageLink("How I chose the order", "notes")
      ),
      page(
        "notes",
        "Collecting notes",
        "What I look for when choosing a card and what I record once it is on my list.",
        heading("Start with a short selection"),
        text(
          "I chose four cards with different jobs on the page. FirstGM opens the selection; the other cards lead into topics I want to discuss. Keeping the list short makes it easier to explain each choice."
        ),
        quote(
          "Before adding another card, write one sentence about why it belongs here.",
          "My collection checklist"
        ),
        heading("Record the source"),
        text(
          "For each entry I keep the card number, title, artist and collection link. My display list is separate from my wallet holdings; a card can be on one list without being on the other."
        ),
        externalLink("About 6529", SOURCE_LINKS.about)
      ),
    ],
  }),
  defineTemplate({
    id: "exhibition",
    name: "Exhibition",
    siteTitle: "After the Signal",
    family: "artist",
    description:
      "A three-work exhibition with an introduction, image sequence and catalogue.",
    presentation: style("gallery", "paper", "serif", "airy"),
    pages: [
      page(
        "studio",
        "After the Signal",
        "Three digital images: blue curved lines, a reflective loop on orange and a dark grid crossed by lights.",
        kicker("Digital exhibition · Three works"),
        image(
          ART.signal,
          "01 / Quiet Signal — blue lines with a red cluster at the lower right."
        ),
        text(
          "The exhibition starts with Quiet Signal, then places Afterimage beside Night Grid. Follow the sequence for notes on each image, or open the catalogue to compare all three."
        ),
        pageLink("Start with Quiet Signal", "first-movement"),
        pageLink("View the catalogue", "catalog")
      ),
      page(
        "first-movement",
        "01 — Quiet Signal",
        "Fine blue lines overlap in broad curves against a cream background.",
        image(ART.signal, ART_CAPTIONS.signal),
        text(
          "Near the lower-right edge, a small cluster of red lines breaks the blue pattern. At full size, the narrow gaps between the lines are easier to distinguish."
        ),
        pageLink("Next: Afterimage and Night Grid", "second-movement"),
        pageLink("Exhibition introduction", "studio")
      ),
      page(
        "second-movement",
        "02 — Afterimage",
        "A reflective, twisted loop hangs above a shadow on an orange background.",
        image(ART.afterimage, ART_CAPTIONS.afterimage, "two_thirds"),
        text(
          "The wide bright reflection follows the outside of the loop. Darker reflections and the opening through its centre make the twist easier to read.",
          "third"
        ),
        image(
          ART.grid,
          "03 / Night Grid — a dark grid crossed by a diagonal strip of lights."
        ),
        heading("03 — Night Grid"),
        text(
          "Small yellow and green cells sit inside a dark rectangular grid. The brightest strip runs from the lower left to the upper right, passing a round junction near the centre."
        ),
        pageLink("View all three works", "catalog")
      ),
      page(
        "catalog",
        "Exhibition catalogue",
        "Quiet Signal, Afterimage and Night Grid, in their exhibition order.",
        gallery(
          "All three works",
          [ART.signal, ART.afterimage, ART.grid],
          "editorial"
        ),
        heading("About this selection"),
        text(
          "These three digital images were generated for the 6529 template library. The sequence compares curved lines, a reflective form and a dense grid; it does not represent a dated series by an existing artist."
        ),
        pageLink("Back to the introduction", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "collection",
    name: "Collection",
    siteTitle: "Rowan Collection",
    family: "collector",
    description:
      "Collection highlights, a focused catalogue and a statement of collecting interests.",
    presentation: style("gallery", "stone", "sans", "compact"),
    pages: [
      page(
        "studio",
        "Rowan Collection",
        "Digital images built around lines, grids and strong colour contrasts.",
        gallery("Collection highlights", [
          ART.signal,
          ART.grid,
          ART.afterimage,
        ]),
        heading("Explore the collection"),
        card(
          "Lines and grids",
          "A closer look at Quiet Signal and Night Grid, from small repeated details to the overall composition."
        ),
        card(
          "Collecting notes",
          "Why I choose a work and the information I keep beside it."
        ),
        pageLink("View lines and grids", "lines-and-fields"),
        pageLink("Collecting approach", "statement")
      ),
      page(
        "lines-and-fields",
        "Lines and grids",
        "Two images that use repeated elements in different ways.",
        image(
          ART.signal,
          "Quiet Signal — fine blue curves with a small red cluster."
        ),
        heading("Curved lines"),
        text(
          "The blue lines in Quiet Signal overlap without forming a regular grid. The red cluster sits close to the edge, well away from the broadest blue curves."
        ),
        image(
          ART.grid,
          "Night Grid — small illuminated cells and a bright diagonal strip."
        ),
        pageLink("Collecting approach", "statement")
      ),
      page(
        "statement",
        "What I collect",
        "I look for digital images that have a clear shape at thumbnail size and details worth opening at full size.",
        heading("Why these works"),
        text(
          "Quiet Signal and Night Grid both contain many small elements, but their structures differ. Afterimage adds a single large form and a much warmer colour. I prefer that mix to a page of very similar images."
        ),
        heading("My catalogue fields"),
        text(
          "I record the title, artist or source, file link and a short note about the image. I keep acquisition records separately and do not treat an image on this page as proof of ownership."
        ),
        quote(
          "Save the original source link before adding a work to the catalogue.",
          "Rowan's catalogue checklist"
        ),
        pageLink("Back to highlights", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "cabinet",
    name: "Cabinet",
    siteTitle: "The Cabinet",
    family: "collector",
    description:
      "A personal reference shelf for art, reading and annotated links.",
    presentation: style("signature", "stone", "serif", "balanced"),
    pages: [
      page(
        "studio",
        "Art and reference shelf",
        "A small collection of images I like and sources I use when publishing my own pages.",
        image(
          ART.afterimage,
          "Afterimage — a reflective loop against orange.",
          "two_thirds"
        ),
        card(
          "Currently on the desk",
          "An image selection, notes on display sizes and a license guide I check before reusing someone else's work.",
          "third"
        ),
        heading("Browse the shelves"),
        pageLink("Art shelf", "art-shelf"),
        pageLink("Reference shelf", "reading-shelf"),
        quote(
          "When I save a link, I add the title and the reason I expect to use it again.",
          "My filing rule"
        )
      ),
      page(
        "art-shelf",
        "Art shelf",
        "Three images selected for different colours and shapes: blue curves, an orange loop and a dark grid.",
        image(ART.signal, ART_CAPTIONS.signal, "half"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        text(
          "I use this shelf to compare images before arranging a page. The orange image is the strongest colour contrast; the blue lines and dark grid reward a larger view."
        ),
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        pageLink("Reference shelf", "reading-shelf")
      ),
      page(
        "reading-shelf",
        "Reference shelf",
        "A license guide and an encyclopedia, with notes on how I use each.",
        heading("Checking reuse permissions"),
        text(
          "I use the Creative Commons guide to check which license an image carries and whether attribution or other conditions apply."
        ),
        externalLink("Creative Commons licenses", SOURCE_LINKS.licenses),
        heading("Finding background and sources"),
        text(
          "Wikipedia is often my first stop for an unfamiliar term. For a claim I plan to publish, I follow the references and check the original source."
        ),
        externalLink("Open Wikipedia", SOURCE_LINKS.wikipedia),
        pageLink("Back to the cabinet", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "artist-studio",
    name: "Artist Studio",
    siteTitle: "Common Shapes",
    family: "artist",
    description:
      "An artist portfolio with selected images, a series page and studio notes.",
    presentation: style("gallery", "paper", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Common Shapes",
        "Rae Ellis makes digital images using vector lines, layered shapes and simple 3D forms.",
        image(ART.signal, ART_CAPTIONS.signal),
        kicker("Selected series / Lines, loops and grids"),
        text(
          "I'm interested in images with a clear shape from a distance and enough detail to hold up close. My current work moves between fine line drawings and single objects with strong lighting."
        ),
        pageLink("View the series", "quiet-structures"),
        pageLink("Studio notes", "statement")
      ),
      page(
        "quiet-structures",
        "Lines, loops and grids",
        "A reference set for a new series of line drawings and object studies.",
        gallery(
          "Three digital studies",
          [ART.signal, ART.afterimage, ART.grid],
          "editorial"
        ),
        heading("Developing the series"),
        text(
          "I am using three references to plan the next set: the narrow curved lines in Quiet Signal, the wide reflections in Afterimage and the small lights in Night Grid. The first new studies will use just blue and cream."
        ),
        pageLink("Read the studio notes", "statement")
      ),
      page(
        "statement",
        "About Rae Ellis",
        "I'm a digital artist working with drawing software and 3D tools. Most projects begin as small tests before I decide which ones need a larger image.",
        text(
          "My working files usually contain several versions of the same idea. I change one thing at a time: line spacing, the angle of a form or the position of a light. I keep a sheet of small exports beside the finished image so I can see which decisions made a difference.\n\nI also make simple printed booklets to check image order. A pair that works on a large screen can be difficult to read across a small spread."
        ),
        heading("On the desk"),
        text(
          "A blue-and-cream line series, a set of reflective loop studies and a short booklet that puts the two together. The current priority is finishing six line studies before adding another colour."
        ),
        heading("Image credits"),
        text(
          "The three reference images shown here were generated for the 6529 template library. Their titles and rights information remain in the asset records."
        ),
        pageLink("Back to selected images", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "medium",
    name: "Medium",
    siteTitle: "Surface Studies",
    family: "artist",
    description:
      "An artist portfolio with a featured image, lighting studies and working notes.",
    presentation: style("gallery", "night", "sans", "airy"),
    pages: [
      page(
        "studio",
        "Surface Studies",
        "Lena Park's portfolio of digital object studies, with notes on shape, lighting and surface.",
        image(
          ART.afterimage,
          "Afterimage — a reflective loop on an orange background."
        ),
        heading("Featured study: Afterimage"),
        text(
          "A reflective loop against orange is the starting reference for a set of lighting experiments. I want to compare how much of the shape can be described by a single broad reflection."
        ),
        pageLink("View Afterimage", "image-study"),
        pageLink("Process notes", "medium-notes")
      ),
      page(
        "image-study",
        "Afterimage",
        "A reflective loop, an orange background and a shadow that separates the form from the surface below it.",
        image(
          ART.afterimage,
          "Afterimage, shown in its full portrait composition."
        ),
        text(
          "For my next object study I want to keep the loop simple and test three light positions. The reference is useful because its bright outside edge and dark inner reflection describe the twist without adding texture."
        ),
        image(
          ART.signal,
          "Quiet Signal — overlapping blue lines and a red accent.",
          "half"
        ),
        image(
          ART.grid,
          "Night Grid — a diagonal strip of lights across a dark grid.",
          "half"
        ),
        pageLink("Process notes", "medium-notes")
      ),
      page(
        "medium-notes",
        "Working with 3D forms",
        "I build small digital scenes to test shape and light before committing to a larger composition.",
        heading("One material at a time"),
        text(
          "I start with a plain surface and one light. Once the silhouette reads clearly, I compare a matte finish with a reflective one. I save both versions; a more complicated material is not always the better choice."
        ),
        heading("Test sheet"),
        text(
          "The next sheet will show the same loop with the light above, beside and behind it. I will keep the camera and background fixed so the differences come from the lighting. The images on this site are the reference set for those tests."
        ),
        quote(
          "Keep the camera fixed for the first three renders. Change only the light.",
          "Lena's render notes"
        ),
        pageLink("Back to the portfolio", "studio")
      ),
    ],
  }),
  defineTemplate({
    id: "process-journal",
    name: "Process Journal",
    siteTitle: "Studio Notebook",
    family: "artist",
    description:
      "An artist's working journal with a planned series, reference images and next-session notes.",
    presentation: style("journal", "stone", "mono", "balanced"),
    pages: [
      page(
        "studio",
        "Planning a blue-line series",
        "Rae's working journal: six planned line studies, a limited palette and notes from the reference images.",
        kicker("Entry 01 · Line spacing"),
        heading("Six studies, two colours"),
        text(
          "I'm planning six blue-and-cream images. The first sheet will compare tightly packed lines with wider gaps before I add any red."
        ),
        pageLink("Read the first entry", "a-rule-with-room"),
        kicker("Entry 02 · Reference sheet"),
        image(ART.grid, ART_CAPTIONS.grid, "half"),
        text(
          "Night Grid gives me a second spacing reference: small bright cells with much larger dark gaps. I want to compare that structure with Quiet Signal's nearly continuous curves.",
          "half"
        ),
        pageLink("View the reference sheet", "outcome")
      ),
      page(
        "a-rule-with-room",
        "Six studies, two colours",
        "The question for this week's drawings: how far apart can the lines move before the curved band stops reading as one shape?",
        heading("Set up the test"),
        text(
          "Use the same canvas and one blue curve for all six studies. Duplicate the curve at three spacings, then make a second version of each with one section removed. Keep the background cream."
        ),
        image(
          ART.signal,
          "Reference: Quiet Signal, with fine blue lines and a red cluster at the edge."
        ),
        heading("First decision"),
        text(
          "Quiet Signal has very narrow gaps where the bands overlap. I want more space in my first sheet so I can judge the line shape. I will leave out the red accent until the six blue versions are ready to compare."
        ),
        heading("Next session"),
        text(
          "Export the six studies at the same size and print them on one sheet. Mark the two with the clearest curves, then use those for a second test with a short red section near the edge."
        ),
        pageLink("View the reference sheet", "outcome")
      ),
      page(
        "outcome",
        "Reference sheet and next steps",
        "Three references for line spacing, dark gaps and the relationship between a small detail and a large form.",
        gallery("Quiet Signal, Night Grid and Afterimage", [
          ART.signal,
          ART.grid,
          ART.afterimage,
        ]),
        text(
          "Quiet Signal is the main line reference. Night Grid is useful for its larger dark gaps, and Afterimage reminds me to check whether the overall shape is clear before adding detail. These are references for the planned drawings, not the finished six-study series."
        ),
        quote(
          "Finish the six blue studies before trying another palette.",
          "Rae's next-session note"
        ),
        pageLink("Back to the first entry", "a-rule-with-room")
      ),
    ],
  }),
  defineTemplate({
    id: "editions",
    name: "Editions",
    siteTitle: "Common Shapes Editions",
    family: "artist",
    description:
      "A work catalogue with media details, edition status and rights notes.",
    presentation: style("gallery", "ink", "sans", "balanced"),
    pages: [
      page(
        "studio",
        "Common Shapes Editions",
        "An artwork catalogue with a separate record for each image and its edition details.",
        image(ART.signal, "Quiet Signal — fine blue curves with a red accent."),
        heading("Featured work: Quiet Signal"),
        text(
          "Open the work record for the image, medium and current edition status."
        ),
        pageLink("View the work record", "quiet-signal"),
        pageLink("Catalogue notes", "edition-notes")
      ),
      page(
        "quiet-signal",
        "Quiet Signal",
        "A landscape digital image of overlapping blue lines with a small cluster of red lines near the lower-right edge.",
        image(ART.signal, "Quiet Signal, shown without a crop."),
        heading("Work details"),
        card("Medium", "Digital image, PNG."),
        card(
          "Edition status",
          "Sample catalogue entry. No edition is offered for sale."
        ),
        heading("Image description"),
        text(
          "The curved blue bands cross over a cream background. Closely spaced lines make darker areas where the bands overlap; the red accent is confined to one corner."
        ),
        pageLink("Catalogue notes", "edition-notes")
      ),
      page(
        "edition-notes",
        "Edition and rights notes",
        "How the catalogue separates the image file, edition information and reuse permissions.",
        heading("Edition details"),
        text(
          "An edition record includes its size, publisher and original release link. If those details are not available, the record stays incomplete and has no purchase link."
        ),
        heading("Rights information"),
        text(
          "The file's rights statement is kept beside the artwork record. A purchase record and permission to reproduce an image are separate pieces of information."
        ),
        externalLink("Creative Commons license guide", SOURCE_LINKS.licenses),
        pageLink("Back to Quiet Signal", "quiet-signal")
      ),
    ],
  }),
  defineTemplate({
    id: "retrospective",
    name: "Retrospective",
    siteTitle: "Common Shapes Archive",
    family: "artist",
    description:
      "An artist's project archive with grouped studies and notes on their development.",
    presentation: style("editorial", "paper", "serif", "compact"),
    pages: [
      page(
        "studio",
        "Common Shapes: project archive",
        "An archive of Rae's project notes, grouped into object studies and line studies.",
        heading("Object studies"),
        text(
          "Notes for simple 3D forms, using Afterimage as a reference for shape and lighting."
        ),
        pageLink("Object study notes", "early-studies"),
        heading("Line studies"),
        text(
          "Plans for blue-line drawings and darker grid compositions, with the reference images kept beside them."
        ),
        pageLink("Line study notes", "later-structures"),
        image(ART.afterimage, ART_CAPTIONS.afterimage),
        pageLink("How the projects developed", "essay")
      ),
      page(
        "early-studies",
        "Object study notes",
        "A project folder for loop shapes and controlled lighting tests.",
        image(
          ART.afterimage,
          "Reference: Afterimage — a reflective loop on orange."
        ),
        text(
          "I began this folder with a plan for a simple loop and three light positions. Afterimage is the reference for the broad highlight and the shadow below the form. The next test needs a fixed camera so I can compare the lighting directly."
        ),
        pageLink("Line study notes", "later-structures"),
        pageLink("How the projects developed", "essay")
      ),
      page(
        "later-structures",
        "Line study notes",
        "A project folder for repeated blue curves and grids with larger dark gaps.",
        image(
          ART.signal,
          "Reference: Quiet Signal — blue curved lines on cream.",
          "half"
        ),
        image(
          ART.grid,
          "Reference: Night Grid — small lights in a dark grid.",
          "half"
        ),
        text(
          "The line project starts with six blue-and-cream studies. The grid project will follow after I have compared the line spacing. I keep separate folders so the second idea does not replace the first before it is finished."
        ),
        pageLink("How the projects developed", "essay")
      ),
      page(
        "essay",
        "From one project to the next",
        "Why I keep short project notes with the reference images and working files.",
        text(
          "The object tests and line studies use different tools, but both need a controlled comparison. In one folder I keep the camera fixed and move the light. In the other I keep the curve fixed and change the spacing.\n\nI write the next action at the end of each session. It saves me from opening the files a week later and spending the first hour remembering which version I meant to continue."
        ),
        heading("What stays in each folder"),
        text(
          "The project question, reference credits, working files, small comparison exports and a note explaining which version to continue. Finished work will get its own catalogue entry when it is ready."
        ),
        pageLink("Back to the project archive", "studio")
      ),
    ],
  }),
];
