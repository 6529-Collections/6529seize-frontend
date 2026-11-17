import type { AiUseSection } from "./types";

// Sections 11 and 12: the API and the command line.

export const AI_USE_API: readonly AiUseSection[] = [
  {
    id: "use-the-api",
    title: "Use the API",
    blocks: [
      {
        kind: "p",
        text: "The API is at `http://127.0.0.1:<port>/v1` and takes OpenAI's requests. Put your key in the environment:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "export OPENAI_API_KEY='6529ai_...'",
      },
      {
        kind: "h3",
        id: "use-the-api-with-curl",
        title: "With curl",
      },
      {
        kind: "p",
        text: "The models this server has:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: 'curl -s http://127.0.0.1:43188/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" | jq',
      },
      {
        kind: "code",
        label: "Output",
        code: `{
  "data": [
    {
      "capabilities": [
        "vision"
      ],
      "created": 1794870225,
      "id": "gemma-4-26b-a4b",
      "modality": "chat",
      "object": "model",
      "owned_by": "local",
      "state": "ready"
    }
  ],
  "object": "list"
}`,
        output: true,
      },
      {
        kind: "p",
        text: "A chat request:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: String.raw`curl -s http://127.0.0.1:43188/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "gemma-4-26b-a4b", "messages": [{"role": "user", "content": "What is the capital of Portugal? One word."}]}' \
  | jq '{answer: .choices[0].message.content, usage}'`,
      },
      {
        kind: "code",
        label: "Output",
        code: `{
  "answer": "Lisbon",
  "usage": {
    "completion_tokens": 60,
    "prompt_tokens": 26,
    "total_tokens": 86,
    "prompt_tokens_details": {
      "cached_tokens": 7
    }
  }
}`,
        output: true,
      },
      {
        kind: "p",
        text: "The full answer also has `reasoning_content`, the model's thinking, and `timings`. Without a key the API answers HTTP 401:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "curl -s http://127.0.0.1:43188/v1/models | jq",
      },
      {
        kind: "code",
        label: "Output",
        code: `{
  "error": {
    "message": "send Authorization: Bearer <key>, or sign in: run 6529-ai-cli open, or open the link in run/login-url in the service's data folder",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}`,
        output: true,
      },
      {
        kind: "p",
        text: "Speech to text takes OpenAI's form:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: String.raw`curl -s http://127.0.0.1:43188/v1/audio/transcriptions -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F model=whisper-large-v3-turbo -F file=@speech-sample.wav | jq`,
      },
      {
        kind: "code",
        label: "Output",
        code: `{
  "text": "And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country."
}`,
        output: true,
      },
      {
        kind: "p",
        text: "An image comes back as base64:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: String.raw`curl -s http://127.0.0.1:43188/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "z-image-turbo", "prompt": "A paper boat on a pond, photograph", "size": "1024x1024", "response_format": "b64_json"}' \
  | jq -r '.data[0].b64_json' | base64 -d > boat.png
file boat.png`,
      },
      {
        kind: "code",
        label: "Output",
        code: "boat.png: PNG image data, 1024 x 1024, 8-bit/color RGB, non-interlaced",
        output: true,
      },
      {
        kind: "h3",
        id: "use-the-api-with-openai-s-python-library",
        title: "With OpenAI's Python library",
      },
      {
        kind: "p",
        text: "Install the library, then give it the base URL. It reads the key from `OPENAI_API_KEY`.",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "python3 -m venv ~/venv && ~/venv/bin/pip install -q openai",
      },
      {
        kind: "p",
        text: "`hello.py`:",
      },
      {
        kind: "code",
        label: "Python",
        code: `from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:43188/v1")

reply = client.chat.completions.create(
    model="gemma-4-26b-a4b",
    messages=[{"role": "user", "content": "Suggest three names for a bakery that sells bread made with old grains. One line each."}],
)
print(reply.choices[0].message.content)`,
      },
      {
        kind: "code",
        label: "Terminal",
        code: "~/venv/bin/python hello.py",
      },
      {
        kind: "code",
        label: "Output",
        code: `Heirloom Hearth
Ancestral Grain Co.
The Old Seed Bakery`,
        output: true,
      },
      {
        kind: "p",
        text: "Streaming, in `stream.py`:",
      },
      {
        kind: "code",
        label: "Python",
        code: `from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:43188/v1")

stream = client.chat.completions.create(
    model="gemma-4-26b-a4b",
    messages=[{"role": "user", "content": "Write a haiku about a GPU."}],
    stream=True,
)
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()`,
      },
      {
        kind: "code",
        label: "Output",
        code: `Silicon and math,
Painting worlds with light and code,
Frames dance on the screen.`,
        output: true,
      },
      {
        kind: "p",
        text: "Speech and images, in `media.py`:",
      },
      {
        kind: "code",
        label: "Python",
        code: `import base64

from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:43188/v1")

with open("speech-sample.wav", "rb") as audio:
    text = client.audio.transcriptions.create(model="whisper-large-v3-turbo", file=audio)
print("Heard:", text.text)

image = client.images.generate(
    model="z-image-turbo",
    prompt="A bowl of ramen on a wooden table, photograph",
    size="1024x1024",
    response_format="b64_json",
)
with open("ramen.png", "wb") as f:
    f.write(base64.b64decode(image.data[0].b64_json))
print("Saved ramen.png")`,
      },
      {
        kind: "code",
        label: "Output",
        code: `Heard: And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country.
Saved ramen.png`,
        output: true,
      },
      {
        kind: "image",
        image: "93b-api-python-image-output",
        alt: "ramen.png, the image media.py saved: a bowl of ramen on a wooden table.",
      },
      {
        kind: "h3",
        id: "use-the-api-with-a-coding-tool",
        title: "With a coding tool",
      },
      {
        kind: "p",
        text: "A tool that takes an OpenAI-compatible endpoint works the same way: give it the base URL, the key and the model's name. Here [aider](https://aider.chat), a coding assistant for the terminal, works in a git repository holding `prices.py`:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: String.raw`python3 -m venv ~/aider-venv && ~/aider-venv/bin/pip install -q aider-chat
~/aider-venv/bin/aider --model openai/gemma-4-26b-a4b --openai-api-base http://127.0.0.1:43188/v1 \
  --no-show-model-warnings --no-check-update --analytics-disable --yes-always \
  --message "Add a function average(prices) that returns the mean, or 0 for an empty list." prices.py`,
      },
      {
        kind: "p",
        text: "It printed the model's thinking and then its answer, a diff, which it applied and committed (the thinking is cut here):",
      },
      {
        kind: "code",
        label: "Output",
        code: `Aider v0.86.2
Model: openai/gemma-4-26b-a4b with whole edit format
Git repo: .git with 1 files
Repo-map: using 1024 tokens, auto refresh
Added prices.py to the chat.
...
► ANSWER
I will add the average(prices) function to prices.py. This function will check if the list is empty to return
0, otherwise it will return the sum of the prices divided by the count.
prices.py

@@ -1,2 +1,5 @@
 def total(prices):
     return sum(prices)
+
+def average(prices):
+    if not prices:
+        return 0
+    return sum(prices) / len(prices)

Tokens: 747 sent, 838 received.
Applied edit to prices.py
Commit b9eede3 feat: add average function`,
        output: true,
      },
      {
        kind: "code",
        label: "Terminal",
        code: `cat prices.py
git log --oneline`,
      },
      {
        kind: "code",
        label: "Output",
        code: `def total(prices):
    return sum(prices)

def average(prices):
    if not prices:
        return 0
    return sum(prices) / len(prices)
b9eede3 (HEAD -> master) feat: add average function
22968b8 start`,
        output: true,
      },
    ],
  },
  {
    id: "the-command-line",
    title: "The command line",
    blocks: [
      {
        kind: "p",
        text: "`6529-ai-cli` does much of the page's work from a terminal. On Linux it reads the data folder, which only the service's user reads:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai status",
      },
      {
        kind: "code",
        label: "Output",
        code: `6529-ai 0.1.0-rc.1, local mode, pid 11658, up 0 h 56 min

MODEL                   MODALITY        ENGINE                STATE  RESTARTS  DETAIL
whisper-large-v3-turbo  speech-to-text  whisper-cpp           ready  0         -
z-image-turbo           image           stable-diffusion-cpp  ready  0         -`,
        output: true,
      },
      {
        kind: "p",
        text: "`registry serve NAME` serves a model, `registry serve NAME --off` stops it, and `keys create`, `keys list` and `keys revoke` manage app keys. `6529-ai-cli --help` lists every command. On a Mac the program is `/Applications/6529 AI.app/Contents/Resources/6529-ai/bin/6529-ai-cli`, and on Windows `C:\\Program Files\\6529 AI\\bin\\6529-ai-cli.exe`; neither is on the PATH.",
      },
    ],
  },
];
