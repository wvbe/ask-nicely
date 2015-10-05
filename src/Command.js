'use strict';

let NamedSyntaxPart = require('./NamedSyntaxPart'),
	Option = require('./Option'),
	Parameter= require('./Parameter');

class Command extends NamedSyntaxPart {
	constructor (name, controller) {
		super (name);
		this.name = name;
		this.children = [];
		this.options = [];
		this.parameters = [];

		this.controller = controller;
		this.preControllers = [];
	}

	match (value) {
		return !!this.getCommandByName(value);
	}

	updateTiersAfterMatch (scopes, match) {
		scopes.splice(scopes.indexOf(this), 1);

		if(match instanceof Command) {
			scopes.splice.apply(scopes, [0, 0].concat(match.parameters).concat(match));
			scopes._.splice.apply(scopes._, [0, 0].concat(match.options));
		}

		return scopes;
	}

	spliceInputFromParts (parts) {
		return this.getCommandByName(parts.shift());
	}

	exportWithInput (request, value) {
		if(value)
			request.command = value;
	}

	executePreControllers () {
		let args = Array.prototype.slice.call(arguments);
		return this.preControllers
			.reduce(function (res, preController) {
				return res.then(function (previousVal) {
					if(previousVal === false)
						return previousVal;

					return preController.apply(null, args);
				});
			}, this.parent
				? this.parent.executePreControllers.apply(this.parent, args)
				: Promise.resolve(true)
		);
	}

	/**
	 * @returns {Promise}
	 */
	execute () {
		let args = Array.prototype.slice.call(arguments);

		return this.executePreControllers.apply(this, args)
			.then(function (previousValue) {
				if(previousValue === false || typeof this.controller !== 'function')
					return previousValue;

				return this.controller.apply(null, args);
			}.bind(this));
	}

	/**
	 * Look up a child command by it's name
	 * @param {String} name
	 * @returns {Command|undefined}
	 */
	getCommandByName (name) {
		return this.children.find(function (child) {
			return child.name === name;
		});
	}

	/**
	 * @param {String} description
	 * @returns {Command}
	 */
	setDescription (description) {
		this.description = description;

		return this;
	}

	/**
	 * Add a controller function that is ran before its own controller, or any of it's descendants controller
	 * @param {Function} cb
	 * @returns {Command}
	 */
	addPreController (cb) {
		this.preControllers.push(cb);

		return this;
	}

	/**
	 * Describe an option
	 * @param {String} long - The identifying name of this option, unique for its ancestry
	 * @param {String} [short] - A one-character alias of this option, unique for its ancestry
	 * @param {String} [description]
	 * @param {Boolean} [required] - If true, an omittance would throw an error
	 * @returns {Command}
	 */
	addOption (long, short, description, required) {
		let isNewApi = !!(long instanceof Option),
			option = (isNewApi
					? long
					: new Option(long)
					.setShort(short)
					.setDescription(description)
					.isRequired(required)
			);

		this.options.push(option);

		return this;
	}

	/**
	 * Describes a parameter. Notice tat if a command has child commands, *required is implied for all ancestor parameters
	 * (and child cmd names will be mistaken for parameters if some is missing)
	 * @param {String} name
	 * @param {String} [description]
	 */
	addParameter (name, description, required) {
		let isNewApi = !!(name instanceof Parameter),
			parameter = (isNewApi
					? name
					: new Parameter(name)
					.setDescription(description)
					.isRequired(required)
			);

		this.parameters.push(parameter);

		return this;
	}

	/**
	 * Register a command as a child of this, and register this as parent of the child
	 * @TODO: Check if child is not in lineage of command, to avoid circularness
	 * @param {String|Command} name
	 * @param {Function} [controller]
	 * @returns {Command} The child command
	 */
	addCommand (name, controller) {
		let child = name instanceof Command ? name : new Command(name, controller);

		child.parent = this;

		this.children.push(child);

		return child;
	}
}

module.exports = Command;