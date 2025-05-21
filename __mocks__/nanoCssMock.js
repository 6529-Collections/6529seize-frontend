const createMock = jest.fn(() => ({
  put: jest.fn(),
}));

const addonMock = jest.fn();

module.exports = {
  create: createMock,
  addon: addonMock,
  default: { create: createMock, addon: addonMock },
  nano_css_1: { create: createMock },
};
