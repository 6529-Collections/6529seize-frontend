// __mocks__/react-use.js
module.exports = {
  useCss: jest.fn(() => ['mocked-classname-from-react-use-mock', jest.fn()]),
  useClickAway: (ref, onClickAway) => {
    const handler = (e) => {
      if (!ref.current || !ref.current.contains(e.target)) {
        onClickAway(e);
      }
    };
    document.addEventListener('click', handler);
  },
  useKeyPressEvent: (key, onKeyDown) => {
    const handler = (e) => {
      if (e.key === key) onKeyDown(e);
    };
    document.addEventListener('keydown', handler);
  },
};
