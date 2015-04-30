var Request = require('./src/Request'),
	Command = require('./src/Command');

/**
 * The Command that serves as a root for the command structure. Includes the request() helper method for easily
 * generating a Request that has the targeted child Command in context. Usually doesn't have a name or controller,
 * and per definition does not have a parent.
 * @TODO: Test what happens on Root.setParent(), or disable this method for Root
 * @param {String} [name]
 * @param {Function} [controller]
 * @constructor
 */
function Root (name, controller) {
	Command.call(this, name, controller);
}

Root.prototype = Object.create(Command.prototype);
Root.prototype.constructor = Object.create(Root);

/**
 * Return a fully formed and executable Request. Consists of the Command and parsed options and/or parameters for it.
 * @todo maybe move this to Command class.
 * @param {Array<String>} route
 * @param {Object} [options]
 * @returns {Request}
 */
Root.prototype.request = function (route, options) {
	var
		// Lookup which command maps to the given array spec
		command = this.getCommandForRoute(route),

		// Parse the expected parameters
		parameters = command.parseParametersFromRoute(route);

	// Clean up the options that are described for the command
	options = command.normalizeOptions(options);

	// Instantiate
	return new Request(
		command,
		options,
		parameters
	);
};

module.exports = Root;
module.exports.Command = Command;
module.exports.Request = Request;