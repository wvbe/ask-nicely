var Request = require('./src/Request'),
	Command = require('./src/Command');

function RootCommand (rootName, rootCommand) {
	Command.call(this, rootName, rootCommand);
}

RootCommand.prototype = Object.create(Command.prototype);
RootCommand.prototype.constructor = Object.create(RootCommand);

RootCommand.prototype.request = function (route, options) {
	var command = this.getCommandForRoute(route),
		parameters = command.parseParametersFromRoute(route);

	options = command.normalizeOptions(options);

	return new Request(
		route,
		command,
		options,
		parameters
	);
};

module.exports = RootCommand;
module.exports.Command = Command;
module.exports.Request = Request;