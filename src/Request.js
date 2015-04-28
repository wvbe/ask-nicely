var q = require('q');

function Request(route, command, options, parameters) {
	this.route = route;
	this.command = command;
	this.options = options;
	this.parameters = parameters;
}

Request.prototype.execute = function() {
	try {
		this.command.validateOptions(this.options);

		var args = arguments;
		return this.command.execute.apply(
			this.command,
			[this].concat(Object.keys(args).map(function (argName) {
				return args[argName];
			}))
		);
	} catch (err) {
		return q.reject(err);
	}
};

module.exports = Request;