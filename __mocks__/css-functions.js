// Mock CSS parsing functions used by react-bootstrap
function cssMock(element, property) {
  // Mock CSS property getter for DOM elements
  if (typeof property === 'string') {
    // Return mock values for common CSS properties
    if (property.includes('duration') || property.includes('delay')) {
      return '0s';
    }
    if (property.includes('margin') || property.includes('padding')) {
      return '0px';
    }
    return '';
  }
  
  // If property is an object, it's a setter operation
  if (typeof property === 'object' && property !== null) {
    return element;
  }
  
  return '';
}

module.exports = cssMock;
module.exports.default = cssMock;