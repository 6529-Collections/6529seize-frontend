// __mocks__/react-use.js
const React = require('react');
module.exports = {
  useCss: jest.fn(() => ['mocked-classname-from-react-use-mock', jest.fn()]),
  useKey: jest.fn(),
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
  createBreakpoint: jest.fn(() => () => 'LG'),
  useIntersection: jest.fn(() => ({ isIntersecting: true })),
  useDebounce: jest.fn((value) => value),
};
