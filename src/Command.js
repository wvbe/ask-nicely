'use strict';

import symbols from './symbols';
import NamedSyntaxPart from './NamedSyntaxPart';
import Option from './Option';
import Parameter from './Parameter';

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

		if(match instanceof Command) {
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

	executePreControllers () {
		let args = Array.prototype.slice.call(arguments);
		return this.preControllers.reduce(
			(res, preController) => res.then(previousVal => previousVal === false
				? previousVal
				: preController.apply(null, args)),
			this.parent
				? this.parent.executePreControllers.apply(this.parent, args)
				: Promise.resolve(true)
		);
	}

	/**
	 * @todo Use rest parameters
	 * @returns {Promise}
	 */
	execute () {
		let args = Array.prototype.slice.call(arguments);

		return this.executePreControllers.apply(this, args)
			.then(previousValue => previousValue === false || typeof this.controller !== 'function'
				? previousValue
				: this.controller.apply(null, args));
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
	 * @param {Function} cb
	 * @returns {Command}
	 */
	setController (cb) {
		this.controller = cb;

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
	 * @param {Function} cb
	 * @returns {Command}
	 */
	addPreController (cb) {
		this.preControllers.push(cb);

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
		this.options.push(long instanceof Option
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
		this.parameters.push(name instanceof Parameter
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
	 * @param {Function} [controller]
	 * @returns {Command} The child command
	 */
	addCommand (name, controller) {
		let child = name instanceof Command
			? name
			: new this[CHILD_CLASS](name, controller);

		child.parent = this;

		this.children.push(child);

		return child;
	}
}
