var q = require('q');

function Request(command, options, parameters) {
	this.command = command;
	this.options = options;
	this.parameters = parameters;
}

/**
 *
 * @returns {Promise}
 */
Request.prototype.execute = function() {
	try {
		// Expected to throw an error when execution is prevented by option errors
		this.command.validateOptions(this.options);


		// Call the Command execute() method with this request as first argument,
		// and whatever other arguments there are after that.
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