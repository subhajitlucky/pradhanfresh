const categoryOperationsExports = require('./categoryOperations');
const operationsExports = require('./operations');
const userHandlersExports = require('./userHandlers');
const userOperationsExports = require('./userOperations');

module.exports = {
  ...categoryOperationsExports,
  ...operationsExports,
  ...userHandlersExports,
  ...userOperationsExports,
};
