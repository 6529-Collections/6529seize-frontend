// __mocks__/react-use.js
module.exports = {
  useCss: jest.fn(() => ['mocked-classname-from-react-use-mock', jest.fn()]),
};
