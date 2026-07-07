import type { MigratedWordPressArticleContent } from "@/components/migrated-wordpress/types";

const externalLinkProps = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

export const disneyDeekayMigratedWordPressArticle = {
  source: "migrated-wordpress",
  path: "/blog/disney-deekay-their-secret-to-animation",
  title: "Disney and DeeKay: Their Secret to Animation",
  description:
    "Some animators possess the talent to move us, rattle us, charm, inspire, delight and amaze in ways that make their art form endure. From Disney to DeeKay, these are the animators who are gifted with the secret recipe for animation that both reflects and affects our humanity.",
  section: "Blog",
  author: {
    href: "https://twitter.com/sabrinaxdoll",
    label: "Sabrina Khan",
  },
  publishedAt: "2023-02-23T18:30:32+00:00",
  modifiedAt: "2023-03-16T19:43:46+00:00",
  readingTime: "16 minutes",
  heroImage: {
    src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2023/02/deekay.jpeg",
    alt: "DeeKay animation artwork used as the article image",
    width: 725,
    height: 956,
  },
  blocks: [
    {
      type: "paragraph",
      content:
        '"I just want to make people smile with my animation and earn enough money along the way to keep this going until I\'m dead."',
    },
    {
      type: "paragraph",
      content:
        'These are the legendary words of DeeKay Kwon, a South Korean artist who has dazzled the art world with his charming, quirky, and meaningful animation shorts. This sentiment of wanting to make the world a happier place through animation is echoed in the famous worlds of another animator who enchanted the world with his groundbreaking animation, Walt Disney: "Animation offers a medium of storytelling and visual entertainment which can bring pleasure and information to people of all ages everywhere in the world."',
    },
    {
      type: "paragraph",
      content:
        "There is plenty of animation floating about, but only few manage to deliver something memorable and relevant to a diverse audience. These animators have concocted the secret recipe to extraordinary animation and utilized these magic ingredients in their animation so that it soars in the public imagination and presents a memorable world view that resonates with its viewers.",
    },
    {
      type: "heading",
      content: "Animation's Early Days",
    },
    {
      type: "paragraph",
      content:
        "The power of animation to move and charm the human soul is something that was understood all the way back in 2000 B.C. when ancient Egyptians drew on cave walls, the same figure repeatedly in slightly different positions, attempting to show motion.",
    },
    {
      type: "paragraph",
      content:
        "By the 1800s, devices such as the phenakistoscope, zoetrope, and praxinoscope used a series of drawings on whirling cards with mirrors to create the illusion of motion when viewed. The appetite for wishing to see animated representations of caricatured reality grew so that by the 1900s, New York was hungry for animators. The art form was new and popular and anyone who could churn out quick animations was handsomely paid.",
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2023/02/the-desert.gif",
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2023/02/the-desert.gif",
        alt: "Phenakistoscope animation",
        width: 400,
        height: 400,
        caption: "Phenakistoscope Animation",
      },
    },
    {
      type: "heading",
      content: "Disney and His Mouse Rule the House",
    },
    {
      type: "paragraph",
      content:
        "But it was not the type of animation that had any longevity or timelessness about it. None of the early animation in those days bothered with plots. Slapstick comedy was the theme of the day, all of the cartoon characters were merely vehicles for farcical buffoonery, designed to elicit laughter. This got stale fast, as there was nothing deep or resonating about any of these one night stands with situational comedy.",
    },
    {
      type: "paragraph",
      content:
        "And then, the 1920s sound revolution left all these plotless cartoons obsolete, except for one: Mickey Mouse. With his tireless vision and his power of plot, Walt Disney clawed through the tangle of flailing animators and rose to the top, using sound effects and motion to create personality and dimensional character. In this way, he established himself as one of the best animators on earth and changed the way animation could affect people.",
    },
    {
      type: "paragraph",
      content:
        'Disney said, "Until a character becomes a personality it cannot be believed. Unless people are able to identify themselves with the character, its actions will seem unreal. And without personality, a story cannot ring true to the audience."',
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2023/02/steamboat-mickey.gif",
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2023/02/steamboat-mickey.gif",
        alt: "Mickey Mouse in Steamboat Willie",
        width: 275,
        height: 219,
        caption: <em>Mickey Mouse in Steamboat Willie</em>,
      },
    },
    {
      type: "paragraph",
      content:
        'This is why Mickey survived and why those early gag reels are turned to dust, because Disney hit upon the very heart of storytelling: "Everything should be related to human experience in storytelling. An incident that happened to you years ago might be usable in a cartoon sequence. That\'s how we tell our stories, not with words."',
    },
    {
      type: "heading",
      content: "DeeKay's Autobiographical Animations",
    },
    {
      type: "paragraph",
      content:
        'This is precisely the recipe utilized by DeeKay to prepare his animations, specifically "I♡NY", a piece that is both a love letter to a city he adores as well as an autobiographical depiction of his personal experience while living and drawing there.',
    },
    {
      type: "paragraph",
      content:
        'DeeKay says, "I wanted to express the busy-ness of the city where everyone is living their own lives but somehow it makes such a nice balance of all being together and makes the great atmosphere of today\'s NYC."',
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/ImmA5S3p/iloveny.mp4",
        title: "I Love NY by DeeKay",
        caption: (
          <a
            href="https://superrare.com/artwork-v2/i%E2%99%A1ny-31243"
            {...externalLinkProps}
          >
            I♡NY
          </a>
        ),
      },
    },
    {
      type: "paragraph",
      content:
        "There is a cinematic quality to the piece set against a bright blue sky boasting fluffy clouds and a rainbow against which stands the Statue of Liberty and the Empire State building. The foreground presents a city street where the viewer is transported into the world of NYC, enraptured by all of the lives that people this place: There is a young man carrying roses that steps off a subway and you cannot help but follow him as he races up the stairs with the eagerness of a young Tom Hanks from a 90s romcom set in the big apple, rushing to the door of his lover who opens the door and a heart emoji fills her thought bubble as she yanks him inside, leaving the roses on the asphalt.",
    },
    {
      type: "paragraph",
      content:
        "On these roses, a passing skateboarder trips and falls flat on his face, and dies in a pool of blood with a skull filling his last thought bubble. It is a story of love and loss and death and action and fiction and DeeKay's own reality.",
    },
    {
      type: "paragraph",
      content:
        "In an exclusive interview, DeeKay reveals that much of what is shown is a true story:",
    },
    {
      type: "paragraph",
      content:
        '"I once failed really hard riding a skateboard and got on an ambulance. I also saw a naked man (naked man on top of the train if you look closely) just being crazy on the subway. I\'ve seen many people giving flowers to their loved ones. Spider-Man is there because I just love the character. Daft Punk is featured because I love their music. A lot has something to do with me but there are also many other things that are just totally random."',
    },
    {
      type: "paragraph",
      content:
        "Disney put his own voice into animating early Mickey Mouse, and many of his contemporaries said they could not determine where Walt ended and Mickey began, so much of his own personality was invested in the gentlemanly, heroic little mouse. Similarly, DeeKay's charming worldview, steeped with humor, wit, and eccentricity, is on full, bright colored display in his work. It is this imprinting of the artists' souls in their work that makes it so meaningful, recognizable, and unforgettable to their audience.",
    },
    {
      type: "heading",
      content: "DeeKay's Art Affects All Ages",
    },
    {
      type: "paragraph",
      content:
        'DeeKay says, "I know how to tell a story and shift your emotions. I know how to make art that a five year old can love. I know how to make happy art."',
    },
    {
      type: "paragraph",
      content:
        'To determine the veracity of this statement, a true five year old was shown the "I Love NY" animation and asked about her emotional reaction to it. She says: "Wow! This makes me feel kind and happy. Kind, because the train drops everybody off and then they get to play. It makes me happy because they get to do anything they want, like play on the playground, take a walk and look at the rainbow. It looks real but it\'s not actually real."',
    },
    {
      type: "quote",
      content: (
        <>
          gm.
          <br />
          probably one of my favorite pictures.
          <br />a kid enjoying my art.{" "}
          <a href="https://t.co/jzW8NCKUHe" {...externalLinkProps}>
            pic.twitter.com/jzW8NCKUHe
          </a>
        </>
      ),
      cite: (
        <>
          DeeKay (@deekaymotion),{" "}
          <a
            href="https://twitter.com/deekaymotion/status/1615496614726041600?ref_src=twsrc%5Etfw"
            {...externalLinkProps}
          >
            January 17, 2023
          </a>
        </>
      ),
    },
    {
      type: "paragraph",
      content:
        'Animation has the power to affect us across ages and generations, inspiring us when we see something familiar. A 23 year old graphic designer sees his own life reflected back to him with his own experiences of starting a new job in a big city. He states, "It can be overwhelming at first perhaps, but it evokes a sense of a beautifully chaotic place where life is occurring everywhere you look. The cartoony style is super inviting. At first everything felt claustrophobic, but then it made me feel comfortable, energized and overall pretty excited ! The vibe is so upbeat and fun!"',
    },
    {
      type: "paragraph",
      content:
        "Good animation has the ability to unlock a gamut of emotions within us, as it taps into what is already there by showing us something new and moving. Very skilled animation has the power to unleash both joy and sorrow, as sometimes it can touch upon a darker, deeper aspect of our world view, as it did for a seventy year old English teacher, who states:",
    },
    {
      type: "paragraph",
      content:
        '"Upon seeing the still shot of New York City, I smiled. The rainbow has eternally been an image of hope. That smile endured for such a short moment once the animation began, and resulted in a sadness washing over me, for I fear that this cartoon creates a dreadful truth about life: We have lost empathy and truly don\'t even notice the possible abduction of one of our own by a UFO."',
    },
    {
      type: "paragraph",
      content:
        "For centuries, scholars have attested that Shakespeare's tragedies are greater literary masterpieces than his comedies, because great art often contains darkness hovering beyond the light, which allows it to transcend and reflect our human condition. This allows it to reach and move us, and DeeKay's animations, though bright and vibrant with lighthearted moments, also contains elements of darkness that make it all the more rich and relatable.",
    },
    {
      type: "paragraph",
      content:
        "Certainly great animation like all great art is subjective and people will bring to it what is already within. But the incontestable fact remains that DeeKay's animations are powerful and move people, similar to how Disney's work continues to move people to this day, decades after his death, with the sheer power of his stories' resonance and relatability.",
    },
    {
      type: "heading",
      content: "Animation Not For Kids But For The Kids In Us All",
    },
    {
      type: "paragraph",
      content: (
        <>
          Similarly, DeeKay's works each capture a sense of story and present
          relatable emotions, such as finding true love in "
          <a
            href="https://superrare.com/artwork-v2/destiny-29095"
            {...externalLinkProps}
          >
            Destiny
          </a>
          ", experiencing the wonder of living and aging in "Life and Death",
          suffering workplace frustration in "
          <a
            href="https://deekaykwon.com/#/designer-client-1/"
            {...externalLinkProps}
          >
            Designer &amp; Client
          </a>
          ", spreading infectious joy in "Happy Virus", or the existence of
          one's angel and devil sides in "
          <a
            href="https://superrare.com/artwork-v2/yin-yang-38023"
            {...externalLinkProps}
          >
            Yin Yang
          </a>
          ." These pieces have the same power to endure in a way that is
          timeless and moving.
        </>
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/7Ye95PFU/happyvirus.mp4",
        title: "Happy Virus by DeeKay",
        caption: (
          <a
            href="https://superrare.com/artwork-v2/happy-virus-24069"
            {...externalLinkProps}
          >
            Happy Virus
          </a>
        ),
      },
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/RM0P4DsO/lifeanddeathdeekay.mp4",
        title: "Life and Death by DeeKay",
        caption: (
          <a
            href="https://superrare.com/artwork-v2/life-and-death-33745"
            {...externalLinkProps}
          >
            Life and Death
          </a>
        ),
      },
    },
    {
      type: "paragraph",
      content:
        "Just as Disney began animation doing gag reels until he realized that producing a character with personality and heart would win the world over, DeeKay left a job doing animation for large corporations to create pieces that are infused with personality, character, and his own world view. Both animators discovered that when done this way, animation can stir the soul and unlock emotions, spread messages, and connect deeply to an audience as powerfully as any great art can.",
    },
    {
      type: "paragraph",
      content:
        'DeeKay states, "Art is a universal language. But I believe animation can deliver a deeper level of emotions that other mediums cannot. And that is possible because animation always has a story."',
    },
    {
      type: "paragraph",
      content:
        "By using cartoon caricatures, the appeal is more poignant, because it appeals to the child within us and it presents a magical kind of reality as we all perhaps once saw it at a time closest to our origins, a time that was youthful and undisturbed by the trappings of age and life experience. Through animation and its powerful storytelling ability, we are transported and its effects upon us are timeless.",
    },
  ],
} satisfies MigratedWordPressArticleContent;
