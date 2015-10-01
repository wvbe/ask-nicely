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

Command.prototype.executePreControllers = function () {
	var args = Array.prototype.slice.call(arguments);
	return this.preControllers
		.reduce(function (res, preController) {
			return res.then(function (previousVal) {
				if(previousVal === false)
					return previousVal;

				return preController.apply(null, args);
			});
		}, this.parent
			? this.parent.executePreControllers.apply(this.parent, args)
			: q.resolve(true)
		);
};

/**
 * @returns {Promise}
 */
Command.prototype.execute = function () {
	var args = Array.prototype.slice.call(arguments);

	return this.executePreControllers.apply(this, args)
		.then(function (previousValue) {
			if(previousValue === false || typeof this.controller !== 'function')
				return previousValue;

			return this.controller.apply(null, args);
		}.bind(this));
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

module.exports = Command;