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

Root.prototype.input = function (pieces) {

	console.log(pieces);

	var options = {},
		route = [],
		lastNamedOption = null;

	for(var i = 0, max = pieces.length; i < max; ++i) {
		var piece = pieces[i];

		// If it is the long notation of an option
		if(piece.indexOf('--') === 0) {
			lastNamedOption = piece.substr(2);
			Array.isArray(options[lastNamedOption])
				? options[lastNamedOption].push(true)
				: options[lastNamedOption] = [true];

			continue;
		}

		// If it is (a block of) short notations of options
		if(piece.indexOf('-') === 0) {
			for(var j = 0; j < piece.length - 1; ++j) {
				lastNamedOption = piece.substr(j + 1, 1);
				Array.isArray(options[lastNamedOption])
					? options[lastNamedOption].push(true)
					: options[lastNamedOption] = [true];
			}
			continue;
		}

		// When it is a value to a previously declared option
		if(lastNamedOption) {
			var currentOptionValue = options[lastNamedOption];
			if(currentOptionValue[currentOptionValue.length - 1] === true)
				currentOptionValue[currentOptionValue.length - 1] = piece;
			else
				currentOptionValue.push(piece);

			continue;
		}

		// If it is not an option
		route.push(piece);
	}

	return this.request(route, options);
};

module.exports = Root;
module.exports.Command = Command;
module.exports.Request = Request;