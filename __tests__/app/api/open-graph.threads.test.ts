import { getThreadsPreview } from "@/app/api/open-graph/threads";

describe("getThreadsPreview", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.THREADS_OEMBED_TOKEN;
    delete process.env.THREADS_OEMBED_VERSION;
  });

  it("extracts metadata for public posts", async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Alice (@alice) on Threads" />
          <meta property="og:description" content="Hello <b>Threads</b>!" />
          <meta property="og:image" content="https://cdn.example.com/avatar.jpg" />
          <meta property="og:image" content="https://cdn.example.com/post-one.jpg" />
          <meta property="og:image" content="https://cdn.example.com/post-two.jpg" />
          <meta property="og:url" content="https://www.threads.net/@alice/post/ABC123?utm_source=test" />
        </head>
      </html>
    `;

    const preview = await getThreadsPreview({
      originalUrl: new URL("https://threads.net/@alice/post/ABC123?utm_source=test"),
      finalUrl: new URL("https://www.threads.net/@alice/post/ABC123?utm_source=test"),
      html,
      contentType: "text/html",
    });

    expect(preview).toEqual(
      expect.objectContaining({
        type: "threads.post",
        canonicalUrl: "https://threads.com/@alice/post/ABC123",
        post: expect.objectContaining({
          handle: "alice",
          postId: "ABC123",
          text: "Hello Threads!",
          author: expect.objectContaining({
            profileUrl: "https://threads.com/@alice",
            avatar: "https://cdn.example.com/avatar.jpg",
          }),
          images: [
            {
              url: "https://cdn.example.com/post-one.jpg",
              alt: "Image from @alice's Threads post",
            },
            {
              url: "https://cdn.example.com/post-two.jpg",
              alt: "Image from @alice's Threads post",
            },
          ],
        }),
      })
    );
  });

  it("marks login-required pages as unavailable", async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Threads • Log in" />
          <meta property="og:description" content="Log in with your Instagram" />
          <meta property="og:url" content="https://www.threads.com/" />
        </head>
      </html>
    `;

    const preview = await getThreadsPreview({
      originalUrl: new URL("https://threads.net/@alice/post/ABC123"),
      finalUrl: new URL("https://www.threads.net/@alice/post/ABC123"),
      html,
      contentType: "text/html",
    });

    expect(preview).toEqual(
      expect.objectContaining({
        type: "threads.unavailable",
        reason: "login_required",
        canonicalUrl: "https://threads.com/@alice/post/ABC123",
      })
    );
  });

  it("returns profile details when viewing a Threads profile", async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Alice Wonderland (@alice) • Threads, Say more" />
          <meta property="og:description" content="123K Followers • Exploring wonderland daily." />
          <meta property="og:image" content="https://cdn.example.com/avatar.jpg" />
          <meta property="og:url" content="https://www.threads.com/@alice" />
        </head>
      </html>
    `;

    const preview = await getThreadsPreview({
      originalUrl: new URL("https://threads.net/@alice"),
      finalUrl: new URL("https://www.threads.net/@alice"),
      html,
      contentType: "text/html",
    });

    expect(preview).toEqual(
      expect.objectContaining({
        type: "threads.profile",
        canonicalUrl: "https://threads.com/@alice",
        profile: expect.objectContaining({
          handle: "alice",
          displayName: "Alice Wonderland",
          avatar: "https://cdn.example.com/avatar.jpg",
          bio: "123K Followers • Exploring wonderland daily.",
        }),
      })
    );
  });

  it("prefers oEmbed data when configured", async () => {
    process.env.THREADS_OEMBED_TOKEN = "token";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        author_name: "Alice Wonderland",
        thumbnail_url: "https://cdn.example.com/oembed.jpg",
        title: "Hello Threads!",
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const html = `
      <html>
        <head>
          <meta property="og:title" content="Threads" />
        </head>
      </html>
    `;

    const preview = await getThreadsPreview({
      originalUrl: new URL("https://threads.net/@alice/post/ABC123"),
      finalUrl: new URL("https://threads.net/@alice/post/ABC123"),
      html,
      contentType: "text/html",
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(preview).not.toBeNull();
    expect(preview).toMatchObject({
      type: "threads.post",
      post: {
        handle: "alice",
        author: {
          displayName: "Alice Wonderland",
          avatar: "https://cdn.example.com/oembed.jpg",
        },
        images: [
          {
            url: "https://cdn.example.com/oembed.jpg",
            alt: "Image from @alice's Threads post",
          },
        ],
        text: "Hello Threads!",
      },
    });
  });

  it("maps oEmbed errors to unavailable responses", async () => {
    process.env.THREADS_OEMBED_TOKEN = "token";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const html = `
      <html>
        <head>
          <meta property="og:title" content="Alice (@alice) on Threads" />
        </head>
      </html>
    `;

    const preview = await getThreadsPreview({
      originalUrl: new URL("https://threads.net/@alice/post/ABC123"),
      finalUrl: new URL("https://threads.net/@alice/post/ABC123"),
      html,
      contentType: "text/html",
    });

    expect(preview).toEqual(
      expect.objectContaining({
        type: "threads.unavailable",
        reason: "login_required",
      })
    );
  });
});
