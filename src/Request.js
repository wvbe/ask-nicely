'use strict';

let resolver = require('./resolver');

/**
 * @constructor
 */
function Request() {

}

/**
 *
 * @param {Command} root
 * @param {String|Array<String>} [parts]
 * @returns {Promise}
 */
Request.resolve = function (root, parts) {
	return resolver(root, parts, new Request());
};

/**
 * Execute command controller, or reject if errors were found
 * @param {*} ... Zero or many arguments to pass on to controller
 * @returns {Promise}
 */
Request.prototype.execute = function() {
	let args = Array.prototype.slice.call(arguments);

	return this.command.execute.apply(
		this.command,
		[this].concat(args)
	);
};

module.exports = Request;