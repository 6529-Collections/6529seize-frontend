const React = require("react");

const FocusTrap = ({ children }) => React.createElement("div", null, children);

FocusTrap.propTypes = {
  children: () => null,
};

module.exports = FocusTrap;
module.exports.FocusTrap = FocusTrap;
module.exports.default = FocusTrap;
