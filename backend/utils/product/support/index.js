const dataPreparationExports = require('./dataPreparation');
const slugExports = require('./slug');

module.exports = {
  ...dataPreparationExports,
  ...slugExports,
};
