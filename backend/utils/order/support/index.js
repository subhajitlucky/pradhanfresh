const calculationsExports = require('./calculations');
const orderNumberExports = require('./orderNumber');
const statusInfoExports = require('./statusInfo');
const stockManagementExports = require('./stockManagement');

module.exports = {
  ...calculationsExports,
  ...orderNumberExports,
  ...statusInfoExports,
  ...stockManagementExports,
};
