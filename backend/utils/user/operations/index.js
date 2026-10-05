/**
 * Barrel for the user operations layer.
 *
 * The directory previously held only addressOperations.js / operations.js /
 * profileOperations.js, so `require('../../utils/user/operations')` resolved to
 * nothing and routes/user/profile.js + routes/user/address.js failed to load.
 */
module.exports = {
  ...require('./operations'),
  ...require('./addressOperations'),
  ...require('./profileOperations'),
};