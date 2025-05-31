// Mock CSS parsing functions used by react-bootstrap
function cssMock(element, property, value) {
  // Handle different call signatures
  if (arguments.length === 0) {
    return function() { return ''; };
  }
  
  // If only element passed, return a function that can handle property access
  if (arguments.length === 1) {
    return function(prop) {
      if (typeof prop === 'string') {
        if (prop.includes('duration') || prop.includes('delay')) {
          return '0s';
        }
        if (prop.includes('margin') || prop.includes('padding')) {
          return '0px';
        }
        return '';
      }
      return '';
    };
  }
  
  // Mock CSS property getter for DOM elements
  if (typeof property === 'string') {
    // If value is provided, it's a setter operation
    if (arguments.length === 3) {
      return element;
    }
    
    // Return mock values for common CSS properties
    if (property.includes('duration') || property.includes('delay')) {
      return '0s';
    }
    if (property.includes('margin') || property.includes('padding')) {
      return '0px';
    }
    if (property.includes('overflow')) {
      return 'visible';
    }
    if (property.includes('position')) {
      return 'static';
    }
    return '';
  }
  
  // If property is an object, it's a setter operation
  if (typeof property === 'object' && property !== null) {
    return element;
  }
  
  return '';
}

// Export as both default and named export to handle different import styles
module.exports = cssMock;
module.exports.default = cssMock;