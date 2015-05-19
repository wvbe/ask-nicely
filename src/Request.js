var q = require('q');

function Request(root, route, options) {
	// The command that this request is for
	this.command = root.getCommandForRoute(route);

	// Values to the Command.parameters definition
	this.parameters = this.command.parseParametersFromRoute(route);

	// Values to the Command.options definition
	this.options = this.command.normalizeOptions(options);
}

Request.fromInput = function (root, pieces) {
	var options = {},
		route = [],
		lastNamedOption = null;

	// If input is a string, split by spaces, except portions enclosed by quotes
	if(typeof pieces === 'string')
		pieces = pieces.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map(function (str) {
			return str.replace(/['"]+/g, '');
		});
	// else if string was already an array, we assume it has been de-quoted etc.

	// Walk the pieces to see which values belong to what option
	// @NOTE: Assumes everything behind the first option belongs to another option, untill a min/max count mechanism for
	//        options (and parameters) is implemented
	for(var i = 0, max = pieces.length; i < max; ++i) {
		var piece = pieces[i];

		// If it is the long notation of an option, the next pieces will be it's value
		if(piece.indexOf('--') === 0 && piece.indexOf(' ') === -1) {
			lastNamedOption = piece.substr(2);
			Array.isArray(options[lastNamedOption])
				? options[lastNamedOption].push(true)
				: options[lastNamedOption] = [true];

			continue;
		}

		// If it is (a block of) short notations of options, register them seperately as true, expect the next piece
		// to be it's value
		if(piece.indexOf('-') === 0 && piece.indexOf(' ') === -1) {
			for(var j = 0; j < piece.length - 1; ++j) {
				lastNamedOption = piece.substr(j + 1, 1);
				Array.isArray(options[lastNamedOption])
					? options[lastNamedOption].push(true)
					: options[lastNamedOption] = [true];
			}
			continue;
		}

		// When it is a value to a previously declared option, register it there
		if(lastNamedOption) {
			var currentOptionValue = options[lastNamedOption];
			if(currentOptionValue[currentOptionValue.length - 1] === true)
				currentOptionValue[currentOptionValue.length - 1] = piece;
			else
				currentOptionValue.push(piece);

			continue;
		}

		// If piece was not option it may be a parameter so push it onto the route
		route.push(piece);
	}

	return new Request(root, route, options);
};

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