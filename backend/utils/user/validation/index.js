/**
 * Barrel for the user validation helpers.
 *
 * Without this file `require('../../utils/user/validation')` fails to resolve:
 * the directory held only validation.js, so routes/user/profile.js could not
 * be required at all and the whole server failed to boot.
 */
module.exports = require('./validation');