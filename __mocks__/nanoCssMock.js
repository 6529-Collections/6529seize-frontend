const createMock = jest.fn(() => ({
  put: jest.fn(),
  // Add any other methods that might be called on the object returned by create()
}));

module.exports = {
  create: createMock, // For direct import/require of 'nano-css'
  default: { create: createMock }, // For import nanoCss from 'nano-css'
  nano_css_1: { create: createMock } // Explicitly for the problematic nano_css_1.create case
}; 
