const actual = jest.requireActual<typeof import("@/services/api/common-api")>(
  "@/services/api/common-api"
);

const makeMock = <Fn extends (...args: any[]) => any>(
  fn: Fn
): jest.MockedFunction<Fn> => {
  return jest.fn((...args: Parameters<Fn>) => fn(...args)) as jest.MockedFunction<Fn>;
};

export const commonApiFetch = makeMock(actual.commonApiFetch);
export const commonApiFetchWithRetry = makeMock(actual.commonApiFetchWithRetry);
export const commonApiPost = makeMock(actual.commonApiPost);
export const commonApiPostWithoutBodyAndResponse = makeMock(
  actual.commonApiPostWithoutBodyAndResponse
);
export const commonApiDelete = makeMock(actual.commonApiDelete);
export const commonApiDeleteWithBody = makeMock(actual.commonApiDeleteWithBody);
export const commonApiPut = makeMock(actual.commonApiPut);
export const commonApiPostForm = makeMock(actual.commonApiPostForm);
