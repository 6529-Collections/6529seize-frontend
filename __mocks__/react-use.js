// __mocks__/react-use.js
const originalReactUse = jest.requireActual('react-use');

module.exports = {
  ...originalReactUse,
  useCss: jest.fn(() => ['mocked-classname-from-react-use-mock', jest.fn()]),
}; 
