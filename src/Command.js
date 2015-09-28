var q = require('q'),

	NamedSyntaxPart = require('./NamedSyntaxPart'),
	Option = require('./Option'),
	Parameter= require('./Parameter');

function arrayFind(parts, cb) {
	for(var i = 0; i<parts.length; ++i) {
		if(cb(parts[i], i, parts))
			return parts[i];
	}
}

function Command(name, controller) {
	NamedSyntaxPart.call(this);

	this.name = name;
	this.children = [];
	this.options = [];
	this.parameters = [];

	this.controller = controller;
	this.preControllers = [];
}

Command.prototype = Object.create(NamedSyntaxPart.prototype);
Command.prototype.constructor = Command;

Command.prototype.match = function (value) {
	return !!this.getCommandByName(value);
};

Command.prototype.updateTiersAfterMatch = function (scopes, match) {
	scopes.splice(scopes.indexOf(this), 1);

	if(match instanceof Command) {
		scopes.splice.apply(scopes, [0, 0].concat(match.parameters).concat(match));
		scopes._.splice.apply(scopes._, [0, 0].concat(match.options));
	}

	return scopes;
};

// doe er iets mee, geef descendants wat over blijft
// is executed before validate()
Command.prototype.spliceInputFromParts = function (parts) {
	return this.getCommandByName(parts.shift());
};




Command.prototype.exportWithInput = function (request, value) {
	if(value)
		request.command = value;
};


/**
 * Execute the controller and makes sure it's output is returned as something that can be "thenned".
 * All arguments to this call are used into the controller call.
 * @returns {Promise}
 */
Command.prototype.execute = function () {
	var args = Array.prototype.slice.call(arguments);
	var resolve = this.getLineage()
		.reduce(function (preControllers, command) {
			if(command.hasPreControllers())
				return preControllers.concat(command.preControllers);
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
		return this.controller.apply(null, args);
	}.bind(this));
};

/**
 * Produce an array of child commands
 * @returns {Array}
 */
Command.prototype.listCommands = function () {
	return this.children;
};

/**
 * Look up a child command by it's name
 * @param {String} name
 * @returns {Command|undefined}
 */
Command.prototype.getCommandByName = function (name) {
	return arrayFind(this.children, function (child) {
		return child.name === name;
	});
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
	return typeof this.controller === 'function';
};

/**
 * @returns {boolean}
 */
Command.prototype.hasPreControllers = function () {
	return this.preControllers.length;
};

/**
 * Add a controller function that is ran before its own controller, or any of it's descendants controller
 * @param cb
 * @returns {Command}
 */
Command.prototype.addPreController = function (cb) {
	this.preControllers.push(cb);

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
	var isNewApi = !!(long instanceof Option),
		option = (isNewApi
				? long
				: new Option(long)
					.setShort(short)
					.setDescription(description)
					.isRequired(required)
			);

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
	var isNewApi = !!(name instanceof Parameter),
		parameter = (isNewApi
				? name
				: new Parameter(name)
					.setDescription(description)
					.isRequired(required)
		);

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
	var child = name instanceof Command ? name : new Command(name, controller);

	child.parent = this;

	this.children.push(child);

	return child;
};


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
 * Get an array of command names that leads up to the current command.
 * @returns {Array<String>}
 */
Command.prototype.getRoute = function () {
	return (this.parent ? this.parent.getRoute().concat([this.name]) : [])
		.concat(this.parameters.length ? this.parameters.map(function (param) {
			return '{' + param.name + '}';
		}) : []);
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
	} while(self = self.parent);

	return lineage;
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

module.exports = Command;