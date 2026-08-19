type DropReactionRequest = () => Promise<void>;

const requestTailByDrop = new Map<string, Promise<void>>();

export const enqueueDropReactionRequest = (
  dropId: string,
  request: DropReactionRequest
): Promise<void> => {
  const previousTail = requestTailByDrop.get(dropId);
  const requestPromise = previousTail ? previousTail.then(request) : request();
  const settledTail = requestPromise.then(
    () => undefined,
    () => undefined
  );

  requestTailByDrop.set(dropId, settledTail);
  void settledTail.then(() => {
    if (requestTailByDrop.get(dropId) === settledTail) {
      requestTailByDrop.delete(dropId);
    }
  });

  return requestPromise;
};

export const __resetDropReactionRequestQueueForTests = (): void => {
  requestTailByDrop.clear();
};
