var q = require('q');

/**
 * @param {String} root
 * @param {Array.<String>} [route]
 * @param {Object} [options]
 * @constructor
 */
function Request(root, route, options) {
	try {
		// The command that this request is for
		this.command = this.parseRoute(root, route);

		// Values to the Command.parameters definition
		this.parameters = this.parseParameters(this.command, route);

		// Values to the Command.options definition
		this.options = this.parseOptions(this.command, options);

		// See if it all makes sense
		this.validate();
	} catch (error) {
		this.error = error;
	}
}

/**
 * Create a request object for a descendant command specified with query pieces (argv)
 * @param root
 * @param pieces
 * @returns {Request}
 */
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

/**
 * Validate all there is to validate. Expected to throw an error if some shit fails.
 */
Request.prototype.validate = function() {
	this.command.validateOptions(this.options);
};

/**
 * Look up a descendant command by an array of command names
 * @param {Array<String>} route
 * @param {Boolean} [returnClosestMatch] Returns the command that was expected to have the first unfound child,
 *                                       defaults to false
 * @returns {Command}
 */
Request.prototype.parseRoute = function (parentCommand, route, returnClosestMatch) {
	var lastCommand = null,
		stashedParameters = 0;

	for (var i = 0; i < route.length; ++i) {
		var routePiece = route[i];

		// If route piece has no value, skip
		if (!routePiece)
			continue;

		// If we're expecting a parameter here, skip
		if (parentCommand.parameters.length > stashedParameters) {
			++stashedParameters;
			continue;
		}

		// Look up the new child command that matches our piece
		lastCommand = parentCommand.getCommandByName(routePiece);

		if (!lastCommand) {
			// If we're not looking for a 100% match, this is the closest we're gonna get
			if (returnClosestMatch)
				break; // End loop peacefully

			// If we were looking for a 100% match, we won't get it so throw an error.
			// Not just programmers may get this error, thus make a human speech effort.
			var parentRoute = parentCommand.getRoute();
			throw new Error('Could not find command "' + route[i] + '"' + (
				parentRoute.length > 0
					? ' in "' + parentRoute.join(' ') + '"'
					: ''
			));
		}

		// Finish one iteration
		parentCommand = lastCommand;

		// If greedy, that means all the rest is part of this command's list parameters,
		// so stop traversing
		if (parentCommand.greedy)
			break;

		// Reset the amount of parameters we're expecting
		stashedParameters = 0;
	}

	return parentCommand;
};

/**
 * Parses parameters interleaved in this command's route path, mapping the parameter values
 * into an object using the param configuration.
 * @param {Command} root
 * @param {Array<String>} route
 * @returns {Object}
 */
Request.prototype.parseParameters = function (root, route) {
	var indexRoute = 0,
		parameters = root.getLineage().reduce(function (parameters, command, index) {
			if(command.parent)
				++indexRoute;

			command.parameters.forEach(function (paramDesc) {
				parameters[paramDesc.name] = route[indexRoute];

				++indexRoute;
			});

			return parameters;
		}, {});

	if (indexRoute < route.length) {
		parameters._ = route.slice(indexRoute);
	}

	return parameters;
};

/**
 * Parses values from option flags. An option may contain one or more value, and/or may be given twice
 * @param command
 * @param dirty
 * @returns {{}}
 */
Request.prototype.parseOptions = function (command, dirty) {
	if (!dirty)
		return {};

	var clean = {},
		dirtyKeys = Object.keys(dirty),
		allowUnknownOptions = command.hungry;

	// Check each described option
	command.getAllOptions().forEach(function (option) {
		// Using the long name for an option makes the short options redundant. This avoids ordering problems
		if (dirty[option.long] !== undefined)
			clean[option.long] = Array.isArray(dirty[option.long]) ? dirty[option.long] : [dirty[option.long]];
		else if (dirty[option.short] !== undefined)
			clean[option.long] = Array.isArray(dirty[option.short]) ? dirty[option.short] : [dirty[option.short]];

		// If not looking for unknown options, return from forEach
		if (!allowUnknownOptions)
			return;

		// If longname is marked as dirty, unmark because we've cleaned it
		if (dirtyKeys.indexOf(option.long) >= 0)
			dirtyKeys.splice(dirtyKeys.indexOf(option.long), 1);

		// If option has a shortname, and it is marked dirty, unmark
		if (option.short && dirtyKeys.indexOf(option.short) >= 0)
			dirtyKeys.splice(dirtyKeys.indexOf(option.short), 1);
	});

	// If interested in undescribed options, patch it on
	if (allowUnknownOptions && dirtyKeys.length)
		dirtyKeys.forEach(function (dirtyKey) {
			clean[dirtyKey] = Array.isArray(dirty[dirtyKey]) ? dirty[dirtyKey] : [dirty[dirtyKey]];
		});

	// Normalize the TRUE values away + flatten 1-length arrays
	Object.keys(clean).forEach(function (optionName) {
		clean[optionName] = clean[optionName].filter(function (val) {
			return val !== true;
		});

		if(clean[optionName].length <= 1)
			clean[optionName] = clean[optionName][0] || true;
	});

	return clean;
};

/**
 * Execute command controller, or reject if errors were found
 * @param {*} ... Zero or many arguments to pass on to controller
 * @returns {Promise}
 */
Request.prototype.execute = function() {
	if (this.error)
		return q.reject(this.error);

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