/** One deadline covers DNS, redirects, and consumption of the final body. */
export function createFetchDeadline(
  caller: AbortSignal | null | undefined,
  timeoutMs: number | undefined,
  timeoutError: () => Error
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const forwardAbort = () => controller.abort(caller?.reason);
  const dispose = () => {
    clearTimeout(timer);
    caller?.removeEventListener("abort", forwardAbort);
    controller.signal.removeEventListener("abort", dispose);
  };

  if (timeoutMs !== undefined) {
    timer = setTimeout(() => controller.abort(timeoutError()), timeoutMs);
  }
  controller.signal.addEventListener("abort", dispose, { once: true });
  if (caller?.aborted) forwardAbort();
  else caller?.addEventListener("abort", forwardAbort, { once: true });

  async function run<T>(operation: () => Promise<T>): Promise<T> {
    controller.signal.throwIfAborted();
    let onAbort: () => void = () => undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(controller.signal.reason);
      controller.signal.addEventListener("abort", onAbort, { once: true });
    });
    try {
      return await Promise.race([operation(), aborted]);
    } finally {
      controller.signal.removeEventListener("abort", onAbort);
    }
  }

  return { signal: controller.signal, dispose, run };
}

type FetchDeadline = ReturnType<typeof createFetchDeadline>;

/** Discarded responses must release their connection even on error paths. */
export function discardResponse(response: Response): void {
  void response.body?.cancel().catch(() => undefined);
}

function preserveResponseMetadata(
  response: Response,
  original: Response
): Response {
  Object.defineProperties(response, {
    url: { value: original.url },
    redirected: { value: original.redirected },
    type: { value: original.type },
  });
  const clone = response.clone.bind(response);
  response.clone = () => preserveResponseMetadata(clone(), original);
  return response;
}

/** Wrap without buffering, so a route can still proxy response.body directly. */
export function bindResponseDeadline(
  response: Response,
  deadline: FetchDeadline
): Response {
  if (!response.body) {
    deadline.dispose();
    return response;
  }

  const reader = response.body.getReader();
  let finished = false;
  let onAbort: () => void = () => undefined;
  const finish = () => {
    finished = true;
    deadline.signal.removeEventListener("abort", onAbort);
    deadline.dispose();
  };
  const cancel = (reason?: unknown) => {
    void reader.cancel(reason).catch(() => undefined);
  };
  const body = new ReadableStream<Uint8Array>(
    {
      start(controller) {
        onAbort = () => {
          if (finished) return;
          finish();
          controller.error(deadline.signal.reason);
          cancel(deadline.signal.reason);
        };
        deadline.signal.addEventListener("abort", onAbort, { once: true });
        if (deadline.signal.aborted) onAbort();
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (finished) return;
          if (done) {
            finish();
            reader.releaseLock();
            controller.close();
          } else {
            controller.enqueue(value);
          }
        } catch (error) {
          if (finished) return;
          finish();
          reader.releaseLock();
          controller.error(error);
        }
      },
      cancel(reason) {
        finish();
        cancel(reason);
      },
    },
    { highWaterMark: 0 }
  );

  return preserveResponseMetadata(
    new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }),
    response
  );
}
