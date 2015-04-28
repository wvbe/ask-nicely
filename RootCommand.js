var Request = require('./src/Request'),
	Command = require('./src/Command');

function RootCommand (rootName, rootCommand) {
	Command.call(this, rootName, rootCommand);
}

RootCommand.prototype = Object.create(Command.prototype);
RootCommand.prototype.constructor = Object.create(RootCommand);

/**
 * Return a fully formed Request
 * @param {Array} route
 * @param {Object} [options]
 * @returns {Request}
 */
RootCommand.prototype.request = function (route, options) {
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

module.exports = RootCommand;
module.exports.Command = Command;
module.exports.Request = Request;