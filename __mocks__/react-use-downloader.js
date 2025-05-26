module.exports = jest.fn(() => ({
  size: 0,
  elapsed: 0,
  percentage: 0,
  download: jest.fn(),
  cancel: jest.fn(),
  error: null,
  isInProgress: false,
}));
