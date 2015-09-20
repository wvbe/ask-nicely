var q = require('q'),
	RequestData = require('./RequestData');

function Command(name, controller) {
	this.name = name;
	this.options = [];
	this.parameters = [];

	this._controller = controller;
	this._preControllers = [];
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
	var args = arguments;
	var resolve = this.getLineage()
		.reduce(function (preControllers, command) {
			if(command.hasPreControllers())
				return preControllers.concat(command._preControllers);
			return preControllers;
		}, [])
		.reduce(function (res, preController) {
			return res.then(function (previousVal) {
				if(previousVal === false)
					return previousVal;
				return preController.apply(null, args);
			});
		}, q.resolve(true));

	if (!this.hasController())
		return resolve;

	return resolve.then(function (previousVal) {
		if(previousVal === false)
			return previousVal;
		return this._controller.apply(null, args);
	}.bind(this));
};

/**
 * Throws an error if an option invalidates a Request to execute
 * @param {Object} optionValues
 * @returns {boolean} If it doesnt throw, it returns TRUE
 */
Command.prototype.validateOptions = function (optionValues) {
	this.getAllOptions().forEach(function (optionSpec) {
		return optionSpec.validate(optionValues[optionSpec.name]);
	});

	return true;
};

Command.prototype.validateParameters = function (paramValues) {
	this.getAllParameters().forEach(function (paramSpec) {
		return paramSpec.validate(paramValues[paramSpec.name]);
	});

	return true;
};

function resolveRequestData (specs, values) {
	return q.all(specs
		.map(function (spec) {
			return spec.resolver
				? spec.resolver(values[spec.name])
				: values[spec.name];
		}))
		.then(function (resolvedOptionValues) {
			specs.forEach(function (spec, i) {
				values[spec.name] = resolvedOptionValues[i];
			});
			return values;
		});
}
Command.prototype.resolveOptions = function (optionValues) {
	return resolveRequestData(this.getAllOptions(), optionValues);
};

Command.prototype.resolveParameters = function (paramValues) {
	return resolveRequestData(this.getAllParameters(), paramValues);
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

/**
 * Mark the command to stop traversing into it's children, effectively swallowing all following route words
 * @param {boolean} isGreedy
 * @returns {Command}
 */
Command.prototype.isGreedy = function (isGreedy) {
	this.greedy = isGreedy === undefined ? true : !!isGreedy;

	return this;
};

/**
 * Mark the command to parse undocumented options to the request object
 * @param {boolean} isHungry
 * @returns {Command}
 */
Command.prototype.isHungry = function (isHungry) {
	this.hungry = isHungry === undefined ? true : !!isHungry;

	return this;
};

/**
 * @param {String} description
 * @returns {Command}
 */
Command.prototype.setDescription = function (description) {
	this.description = description;

	return this;
};

/**
 * @returns {boolean}
 */
Command.prototype.hasController = function () {
	return typeof this._controller === 'function';
};

/**
 * @returns {boolean}
 */
Command.prototype.hasPreControllers = function () {
	return this._preControllers.length;
};

/**
 * Add a controller function that is ran before its own controller, or any of it's descendants controller
 * @param cb
 * @returns {Command}
 */
Command.prototype.addPreController = function (cb) {
	this._preControllers.push(cb);

	return this;
};

/**
 * Describe an option
 * @param {String} long - The identifying name of this option, unique for its ancestry
 * @param {String} [short] - A one-character alias of this option, unique for its ancestry
 * @param {String} [description]
 * @param {Boolean} [required] - If true, an omittance would throw an error
 * @returns {Command}
 */
Command.prototype.addOption = function (long, short, description, required) {
	var isNewApi = !!(long instanceof RequestData),
		option = (isNewApi
				? long
				: new RequestData(long)
					.setShort(short)
					.setDescription(description)
					.isRequired(required)
			).forCommand(this);

	this.options.push(option);

	return this;
};

/**
 * Describes a parameter. Notice tat if a command has child commands, *required is implied for all ancestor parameters
 * (and child cmd names will be mistaken for parameters if some is missing)
 * @param {String} name
 * @param {String} [description]
 */
Command.prototype.addParameter = function (name, description, required) {
	var isNewApi = !!(name instanceof RequestData),
		parameter = (isNewApi
				? name
				: new RequestData(name)
				.setDescription(description)
				.isRequired(required)
		).forCommand(this);

	this.parameters.push(parameter);

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

Command.prototype.getAllParameters = function () {
	return this.getLineage().reduce(function (allParameters, command) {
		return allParameters.concat(command.parameters);
	}, []);
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