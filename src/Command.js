var q = require('q');

function Command(name, controller) {
	this.name = name;
	this.options = [];
	this.parameters = [];

	this._controller = controller;
}

/**
 * Override serialization method to avoid circulatory bullshit. Produces something like "jetpack start",
 * reflecting the hierarchical path. Route parameters are seperated by a space
 * since this character has the same reserved status in terminals. Does not include parameters.
 * @TODO: Include parameter names, like "jetpack approach {destination}"
 * @returns {String}
 */
Command.prototype.toJSON = function () {
	return this.getRoute().join(' ');
};

/**
 * Execute the controller and makes sure it's output is returned as something that can be "thenned".
 * All arguments to this call are used into the controller call.
 * @returns {Promise}
 */
Command.prototype.execute = function () {
	if (!this.hasController())
		return q.resolve();

	var response = this._controller.apply(null, arguments);

	if (!isPromised(response))
		return q.resolve(response);

	return response;
};

/**
 * Throws an error if an option invalidates a Request to execute
 * @param {Object} options
 * @returns {boolean} If it doesnt throw, it returns TRUE
 */
Command.prototype.validateOptions = function (options) {
	this.getAllOptions().forEach(function (option) {
		if (option.required && options[option.long] === undefined)
			// Not just programmers may get this error, thus make a human speech effort
			// @TODO: Do that
			throw new Error('Wrong argument, option "'+option.long+'" can not be undefined.');
	});

	return true;
};

/**
 * Produce an array of child commands
 * @returns {Array}
 */
Command.prototype.listCommands = function () {
	return this.children ? Object.keys(this.children).map(function (key) {
		return this.children[key];
	}.bind(this)) : [];
};

/**
 * Look up a child command by it's name
 * @param {String} name
 * @returns {Command|undefined}
 */
Command.prototype.getCommandByName = function (name) {
	return this.children ? this.children[name] : undefined;
};

/**
 * Look up a descendant command by an array of command names
 * @param {Array<String>} route
 * @param {Boolean} [returnClosestMatch] Returns the command that was expected to have the first unfound child,
 *                                       defaults to false
 * @returns {Command}
 */
Command.prototype.getCommandForRoute = function (route, returnClosestMatch) {
	var parentCommand = this,
		lastCommand = null,
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
 * @param {Array<String>} route
 * @returns {Object}
 */
Command.prototype.parseParametersFromRoute = function (route) {
	var indexRoute = 0,
		parameters = this.getLineage().reduce(function (parameters, command, index) {
			command.parameters.forEach(function (paramDesc) {
				parameters[paramDesc.name] = route[indexRoute];

				++indexRoute;
			});
			++indexRoute;
			return parameters;
		}, {});

	if (indexRoute < route.length) {
		parameters._ = route.slice(indexRoute - 1);
	}

	return parameters;
};

/**
 * Returns an array starting at the Root, ending with the current Command and containing all Commands in between
 * @returns {Array<Command>}
 */
Command.prototype.getLineage = function () {
	var lineage = [],
		self = this; // highest-level parents first, closest last
	do {
		lineage.unshift(self);
	} while(self = self.getParent());

	return lineage;
};

/**
 * Get an array of command names that leads up to the current command.
 * @returns {Array<String>}
 */
Command.prototype.getRoute = function () {
	return this.getLineage().reduce(function (route, ancestor) {
		if(ancestor.getParent()) // in other words, if it is a root
			route.push(ancestor.name);

		if(ancestor.parameters.length)
			route = route.concat(ancestor.parameters.map(function (param) {
				return '{' + param.name + '}';
			}));

		return route;
	}, []);
};

/**
 * Register another Command as it's parent
 * @note if used manually you might forget to register the command amongst it's parents children.
 * @todo rename to _setParent to denote its preferably internal use
 * @param {Command} command
 * @returns {Command} itself
 */
Command.prototype.setParent = function (command) {
	// Combat programmers who are goofing around
	if (!(command instanceof Command))
		throw new Error('Parent for "' + this.name + '" is of wrong type');

	this.parent = command;

	return this;
};

/**
 *
 * @returns {Command|undefined}
 */
Command.prototype.getParent = function () {
	return this.parent;
};

// wether or not all succeeding route words are swallowed by this command, meaning
// traversing into a tree stops at this node.
Command.prototype.isGreedy = function (isGreedy) {
	this.greedy = isGreedy === undefined ? true : !!isGreedy;

	return this;
};

// wether or not request options that are not described with addOption() are normalized
// away in normalizeOptions()
Command.prototype.isHungry = function (isHungry) {
	this.hungry = isHungry === undefined ? true : !!isHungry;

	return this;
};

Command.prototype.addDescription = function (description) {
	this.description = description;

	return this;
};

Command.prototype.hasController = function () {
	return typeof this._controller === 'function';
};
/**
 * Describe an option
 * @param {String} long - The identifying name of this option
 * @param {String} [short] - A one-character alias of this option
 * @param {String} [description]
 * @param {Boolean} [required] - If true, an omittance would throw an error
 * @returns {Command}
 */
Command.prototype.addOption = function (long, short, description, required) {

	// Combat programmers who are goofing around
	if (this.options.length && this.options.some(function (opt) {
		return opt.long === long || (short && short === opt.short);
	}))
		throw new Error('Already an option with either this long "' + long + '" or short  "' + short + '"');

	this.options.push({
		long: long,
		short: short,
		description: description,
		required: !!required
	});

	return this;
};

/**
 * Describes a parameter
 * @param {String} name
 * @param {String} [description]
 */
Command.prototype.addParameter = function (name, description) {
	this.parameters.push({
		name: name,
		description: description
		//required: required
	});

	return this;
};

/**
 * Register a command as a child of this, and register this as parent of the child
 * @TODO: Check if child is not in lineage of command, to avoid circularness
 * @param {String|Command} name
 * @param {Function} [controller]
 * @returns {Command} The child command
 */
Command.prototype.addCommand = function (name, controller) {
	if (!name || (name instanceof Command && !name.name))
		throw new Error('Child command must have a name');

	var child = name instanceof Command ? name : new Command(name, controller);



	if (this.children && this.children[child.name])
		throw Error('Child command "' + name + '" already exists, cannot be re-registered.');

	child.setParent(this);

	if (!this.children)
		this.children = {};

	this.children[name] = child;

	return child;
};

Command.prototype.getAllOptions = function () {
	return this.getLineage().reduce(function (allOptions, command) {
		return allOptions.concat(command.options);
	}, []);
};

Command.prototype.normalizeOptions = function (dirty) {
	if (!dirty)
		return {};

	var clean = {},
		dirtyKeys = Object.keys(dirty),
		allowUnknownOptions = this.hungry;

	// Check each described option
	this.getAllOptions().forEach(function (option) {
			// If long name is used, copy to clean
			if (dirty[option.long] !== undefined) {
				clean[option.long] = dirty[option.long];

				// Else try short name
			} else if (dirty[option.short] !== undefined) {
				clean[option.long] = dirty[option.short];
			}

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

	// If not interested in undescribed options or if there's no other data, return
	if (!allowUnknownOptions || !dirtyKeys.length)
		return clean;

	// Patch dirty data unto cleaned object :(
	dirtyKeys.forEach(function (dirtyKey) {
		clean[dirtyKey] = dirty[dirtyKey];
	});

	return clean;
};


function isPromised(promise) {
	if (promise instanceof q.Promise)
		return true;
	if (!promise)
		return false;
	if (!promise.then || typeof promise.then !== 'function')
		return false;
	if (!promise.catch || typeof promise.catch !== 'function')
		return false;
	if (!promise.finally || typeof promise.finally !== 'function')
		return false;

	return true;
}


module.exports = Command;