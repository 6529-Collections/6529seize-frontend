/**
 * Pins the uniform [0, 1) sample that `helpers/jitter.helpers` draws from Web
 * Crypto. 0.5 keeps jitter neutral (a 1.0 multiplier); 0 and values near 1
 * hit the lower and upper jitter bounds.
 */
export function mockRandomUnit(unit: number): jest.SpyInstance {
  const sample = Math.min(Math.floor(unit * 2 ** 32), 2 ** 32 - 1);
  return jest
    .spyOn(globalThis.crypto, "getRandomValues")
    .mockImplementation((array) => {
      if (array instanceof Uint32Array && array.length > 0) {
        array[0] = sample;
      }
      return array;
    });
}
