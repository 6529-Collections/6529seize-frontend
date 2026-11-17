import { command, h3, image, p, printed } from "./blocks";
import type { AiUseSection } from "./types";

// Sections 11 and 12: the API and the command line.

export const AI_USE_API: readonly AiUseSection[] = [
  {
    id: "use-the-api",
    title: "Use the API",
    blocks: [
      p(
        "The API is at `http://127.0.0.1:<port>/v1` and takes OpenAI's requests. Put your key in the environment:"
      ),
      command("Terminal", "export OPENAI_API_KEY='6529ai_...'"),
      h3("use-the-api-with-curl", "With curl"),
      p("The models this server has:"),
      command(
        "Terminal",
        'curl -s http://127.0.0.1:43188/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" | jq'
      ),
      printed(`{
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
}`),
      p("A chat request:"),
      command(
        "Terminal",
        String.raw`curl -s http://127.0.0.1:43188/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "gemma-4-26b-a4b", "messages": [{"role": "user", "content": "What is the capital of Portugal? One word."}]}' \
  | jq '{answer: .choices[0].message.content, usage}'`
      ),
      printed(`{
  "answer": "Lisbon",
  "usage": {
    "completion_tokens": 60,
    "prompt_tokens": 26,
    "total_tokens": 86,
    "prompt_tokens_details": {
      "cached_tokens": 7
    }
  }
}`),
      p(
        "The full answer also has `reasoning_content`, the model's thinking, and `timings`. Without a key the API answers HTTP 401:"
      ),
      command("Terminal", "curl -s http://127.0.0.1:43188/v1/models | jq"),
      printed(`{
  "error": {
    "message": "send Authorization: Bearer <key>, or sign in: run 6529-ai-cli open, or open the link in run/login-url in the service's data folder",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}`),
      p("Speech to text takes OpenAI's form:"),
      command(
        "Terminal",
        String.raw`curl -s http://127.0.0.1:43188/v1/audio/transcriptions -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F model=whisper-large-v3-turbo -F file=@speech-sample.wav | jq`
      ),
      printed(`{
  "text": "And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country."
}`),
      p("An image comes back as base64:"),
      command(
        "Terminal",
        String.raw`curl -s http://127.0.0.1:43188/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "z-image-turbo", "prompt": "A paper boat on a pond, photograph", "size": "1024x1024", "response_format": "b64_json"}' \
  | jq -r '.data[0].b64_json' | base64 -d > boat.png
file boat.png`
      ),
      printed(
        "boat.png: PNG image data, 1024 x 1024, 8-bit/color RGB, non-interlaced"
      ),
      h3(
        "use-the-api-with-openai-s-python-library",
        "With OpenAI's Python library"
      ),
      p(
        "Install the library, then give it the base URL. It reads the key from `OPENAI_API_KEY`."
      ),
      command(
        "Terminal",
        "python3 -m venv ~/venv && ~/venv/bin/pip install -q openai"
      ),
      p("`hello.py`:"),
      command(
        "Python",
        `from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:43188/v1")

reply = client.chat.completions.create(
    model="gemma-4-26b-a4b",
    messages=[{"role": "user", "content": "Suggest three names for a bakery that sells bread made with old grains. One line each."}],
)
print(reply.choices[0].message.content)`
      ),
      command("Terminal", "~/venv/bin/python hello.py"),
      printed(`Heirloom Hearth
Ancestral Grain Co.
The Old Seed Bakery`),
      p("Streaming, in `stream.py`:"),
      command(
        "Python",
        `from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:43188/v1")

stream = client.chat.completions.create(
    model="gemma-4-26b-a4b",
    messages=[{"role": "user", "content": "Write a haiku about a GPU."}],
    stream=True,
)
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()`
      ),
      printed(`Silicon and math,
Painting worlds with light and code,
Frames dance on the screen.`),
      p("Speech and images, in `media.py`:"),
      command(
        "Python",
        `import base64

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
print("Saved ramen.png")`
      ),
      printed(`Heard: And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country.
Saved ramen.png`),
      image(
        "93b-api-python-image-output",
        "ramen.png, the image media.py saved: a bowl of ramen on a wooden table."
      ),
      h3("use-the-api-with-a-coding-tool", "With a coding tool"),
      p(
        "A tool that takes an OpenAI-compatible endpoint works the same way: give it the base URL, the key and the model's name. Here [aider](https://aider.chat), a coding assistant for the terminal, works in a git repository holding `prices.py`:"
      ),
      command(
        "Terminal",
        String.raw`python3 -m venv ~/aider-venv && ~/aider-venv/bin/pip install -q aider-chat
~/aider-venv/bin/aider --model openai/gemma-4-26b-a4b --openai-api-base http://127.0.0.1:43188/v1 \
  --no-show-model-warnings --no-check-update --analytics-disable --yes-always \
  --message "Add a function average(prices) that returns the mean, or 0 for an empty list." prices.py`
      ),
      p(
        "It printed the model's thinking and then its answer, a diff, which it applied and committed (the thinking is cut here):"
      ),
      printed(`Aider v0.86.2
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
Commit b9eede3 feat: add average function`),
      command(
        "Terminal",
        `cat prices.py
git log --oneline`
      ),
      printed(`def total(prices):
    return sum(prices)

def average(prices):
    if not prices:
        return 0
    return sum(prices) / len(prices)
b9eede3 (HEAD -> master) feat: add average function
22968b8 start`),
    ],
  },
  {
    id: "the-command-line",
    title: "The command line",
    blocks: [
      p(
        "`6529-ai-cli` does much of the page's work from a terminal. On Linux it reads the data folder, which only the service's user reads:"
      ),
      command(
        "Terminal",
        "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai status"
      ),
      printed(`6529-ai <version>, local mode, pid 11658, up 0 h 56 min

MODEL                   MODALITY        ENGINE                STATE  RESTARTS  DETAIL
whisper-large-v3-turbo  speech-to-text  whisper-cpp           ready  0         -
z-image-turbo           image           stable-diffusion-cpp  ready  0         -`),
      p(
        "`registry serve NAME` serves a model, `registry serve NAME --off` stops it, and `keys create`, `keys list` and `keys revoke` manage app keys. `6529-ai-cli --help` lists every command. On a Mac the program is `/Applications/6529 AI.app/Contents/Resources/6529-ai/bin/6529-ai-cli`, and on Windows `C:\\Program Files\\6529 AI\\bin\\6529-ai-cli.exe`; neither is on the PATH."
      ),
    ],
  },
];
