const tasks = ["npm test", "npm run lint", "npm run type-check"];

module.exports = {
  "**/*": () => [...tasks],
};
