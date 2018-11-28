'use strict';

import symbols from './symbols';
import NamedSyntaxPart from './NamedSyntaxPart';
import Option from './Option';
import Parameter from './Parameter';

import interpreter from './interpreter';
import Request from './Request';

const CHILD_CLASS = Symbol('child command class definition');

export default class Command extends NamedSyntaxPart {
	constructor (name, controller) {
		super(name);
		this.parent = null;
		this.controller = null;
		this.children = [];
		this.aliases = [];
		this.options = [];
		this.parameters = [];
		this.preControllers = [];

		this.setNewChildClass(Command);
		this.setController(controller);
	}

	[symbols.isMatchForPart] (value) {
		return !!this.getCommandByName(value);
	}

	[symbols.updateTiersAfterMatch] (tiers, match) {
		tiers.ordered.splice(tiers.ordered.indexOf(this), 1);

		if(match.getType() === 'command') {
			tiers.ordered.splice.apply(tiers.ordered, [0, 0].concat(match.parameters).concat(match));
			tiers.unordered.splice.apply(tiers.unordered, [0, 0].concat(match.options));
		}

		return tiers;
	}

	[symbols.spliceInputFromParts] (parts) {
		return this.getCommandByName(parts.shift());
	}

	[symbols.exportWithInput] (request, value) {
		if(value)
			request.command = value;
	}

	/**
	 * Parse input onto a request object, and execute accordingly
	 * @param {String|Array<String>} [parts]
	 * @param {Object} [request] An existing Request, if you do not want to make a new one if you want to re-use it
	 * @returns {Promise}
	 */
	execute (parts, request, ...args) {
		return interpreter(this, parts, request || new Request(), true, args)
			.then(request => request.command.getControllerStack().apply(request.command, [request, ...args]));
	}

	getType () {
		return 'command';
	}

	/**
	 *
	 * @param parts
	 * @param request
	 * @param args
	 */
	// parse (parts, request, ...args) {
	// 	return interpreter(this, parts, request || new Request(), false, args);
	// }

	/**
	 * Execute all ancestroy precontrollers
	 * @param args
	 * @returns {*}
	 */
	executePreControllers (...args) {
		return this.preControllers.reduce(
			(res, preController) => res.then(previousVal => previousVal === false
				? previousVal
				: preController(...args)),
			this.parent
				? this.parent.executePreControllers(...args)
				: Promise.resolve(true)
		);
	}

	/**
	 * Returns a function that executes all ancestry precontrollers and this command's controller
	 * @returns {Function}
	 */
	getControllerStack () {
		return (...args) => this.executePreControllers(...args)
			.then(previousValue => previousValue === false || typeof this.controller !== 'function'
				? previousValue
				: this.controller(...args)
			);
	}

	/**
	 * Look up a child command by it's name
	 * @param {String} name
	 * @returns {Command|undefined}
	 */
	getCommandByName (name) {
		return this.children.find(child => child.name === name || child.aliases.indexOf(name) >= 0);
	}

	/**
	 * Set the main controller
	 * @param {Function} controller The controller function or absolute path to the controller source file.
	 * @returns {Command}
	 */
	setController (controller) {
		if (typeof controller === 'string') {
			this.controller = (...args) => {
				return import(controller).then(controllerFunction => controllerFunction(...args));
			};
		}
		else {
			this.controller = controller;
		}

		return this;
	}

	/**
	 * Defines what class new child instances should have if they're being instantiated by this object
	 * @param ClassObject
	 * @returns {Command}
	 */
	setNewChildClass (ClassObject) {
		this[CHILD_CLASS] = ClassObject;

		return this;
	}

	/**
	 * Add a precontroller function that is ran before its own controller, or any of it's descendants precontrollers
	 * @param {Function} preController
	 * @returns {Command}
	 */
	addPreController (preController) {
		this.preControllers.push(preController);

		return this;
	}

	/**
	 * Give command an alternative name
	 * @param {String} name
	 * @returns {Command}
	 */
	addAlias (name) {
		this.aliases.push(name);

		return this;
	}

	/**
	 * Describe an option
	 * @param {Option|String} long - The identifying name of this option, unique for its ancestry
	 * @param {String} [short] - A one-character alias of this option, unique for its ancestry
	 * @param {String} [description]
	 * @param {Boolean} [required] - If true, an omittance would throw an error
	 * @returns {Command}
	 */
	addOption (long, short, description, required) {
		this.options.push(typeof long.getType === 'function' && long.getType() === 'option'
			? long
			: new Option(long)
				.setShort(short)
				.setDescription(description)
				.isRequired(required)
		);

		return this;
	}

	/**
	 * Describes a parameter. Notice tat if a command has child commands, *required is implied for all ancestor parameters
	 * (and child cmd names will be mistaken for parameters if some is missing)
	 * @param {Parameter|String} name
	 * @param {String} [description]
	 * @param {Boolean} [required]
	 * @returns {Command}
	 */
	addParameter (name, description, required) {
		this.parameters.push(typeof name.getType === 'function' && name.getType() === 'parameter'
			? name
			: new Parameter(name)
				.setDescription(description)
				.isRequired(required)
		);

		return this;
	}

	/**
	 * Register a command as a child of this, and register this as parent of the child
	 * @TODO: Check if child is not in lineage of command, to avoid circularness
	 * @param {String|Command} name
	 * @param {Function|string} [controller] The controller function or absolute path to the controller source file.
	 * @returns {Command} The child command
	 */
	addCommand (name, controller) {
		let child = typeof name.getType === 'function' && name.getType() === 'command'
			? name
			: new this[CHILD_CLASS](name, controller);

		child.parent = this;

		this.children.push(child);

		return child;
	}
}
