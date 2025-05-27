// __mocks__/react-use.js
module.exports = {
  useCss: jest.fn(() => ['mocked-classname-from-react-use-mock', jest.fn()]),
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
  createBreakpoint: jest.fn(() => () => 'LG'),
  useIntersection: jest.fn(() => ({ isIntersecting: true })),
  useDebounce: jest.fn((value) => value),
};
