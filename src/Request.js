var q = require('q');

function Request(command, options, parameters) {
	this.command = command; // The command that this request is for
	this.options = options; // Values to the Command.options definition
	this.parameters = parameters; // Values to the Command.parameters definition
}

Request.prototype.validate = function() {
	this.command.validateOptions(this.options);
};
/**
 *
 * @returns {Promise}
 */
Request.prototype.execute = function() {
	// Expected to throw an error when execution is prevented by option errors
	try {
		this.validate();
	} catch (err) {
		return q.reject(err);
	}

	// Call the Command execute() method with this request as first argument,
	// and whatever other arguments there are after that.
	var args = arguments;
	return this.command.execute.apply(
		this.command,
		[this].concat(Object.keys(args).map(function (argName) {
			return args[argName];
		}))
	);
};

module.exports = Request;