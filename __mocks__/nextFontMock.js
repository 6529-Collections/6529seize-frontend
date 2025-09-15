// Mock for next/font
const createFontMock = () => ({
  className: 'mock-font-class',
  style: { fontFamily: 'mock-font' }
});

// Export all common font functions
module.exports = {
  Inter: createFontMock,
  Roboto: createFontMock,
  Open_Sans: createFontMock,
  Lato: createFontMock,
  Montserrat: createFontMock,
  // Default export for direct imports
  __esModule: true,
  default: createFontMock
};