'use strict';

import symbols from './symbols';
import NamedSyntaxPart from './NamedSyntaxPart';
import Option from './Option';
import Parameter from './Parameter';

import interpreter from './interpreter';
import Request from './Request';

const CHILD_CLASS = Symbol('child command class definition');

export default class Command extends NamedSyntaxPart {
	constructor(name, controller) {
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

	[symbols.isMatchForPart](value) {
		return !!this.getCommandByName(value);
	}

	[symbols.updateTiersAfterMatch](tiers, syntaxPartThatWasMatched) {
		tiers.ordered.splice(tiers.ordered.indexOf(this), 1);

		if (syntaxPartThatWasMatched.getType() === 'command') {
			tiers.ordered.splice.apply(
				tiers.ordered,
				[0, 0].concat(syntaxPartThatWasMatched.parameters).concat(syntaxPartThatWasMatched)
			);
			tiers.unordered.splice.apply(
				tiers.unordered,
				[0, 0].concat(syntaxPartThatWasMatched.options)
			);
		}

		return tiers;
	}

	[symbols.spliceInputFromParts](parts) {
		return this.getCommandByName(parts.shift());
	}

	[symbols.createContributionToRequestObject](accumulated, value) {
		return value ? { command: value } : null;
	}

	/**
	 * Parse input onto a request object, and execute accordingly
	 * @param {String|Array<String>} [parts]
	 * @param {Object} [request] An existing Request, if you do not want to make a new one if you want to re-use it
	 * @return {Promise}
	 */
	async 'execute'(parts, initialRequest, ...args) {
		const request = await interpreter(this, parts, initialRequest || new Request(), true, args);
		return request.command.getControllerStack().apply(request.command, [request, ...args]);
	}

	'getType'() {
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
	 * @return {*}
	 */
	'executePreControllers'(...args) {
		return this.preControllers.reduce(
			(res, preController) =>
				res.then(previousVal =>
					previousVal === false ? previousVal : preController(...args)
				),
			this.parent ? this.parent.executePreControllers(...args) : Promise.resolve(true)
		);
	}

	/**
	 * Returns a function that executes all ancestry precontrollers and this command's controller
	 * @return {function(Type, Type): Type}
	 */
	'getControllerStack'() {
		return (...args) =>
			this.executePreControllers(...args).then(previousValue =>
				previousValue === false || typeof this.controller !== 'function'
					? previousValue
					: this.controller(...args)
			);
	}

	/**
	 * Look up a child command by it's name
	 * @param {string} name
	 * @return {Command|undefined}
	 */
	'getCommandByName'(name) {
		return this.children.find(child => child.name === name || child.aliases.indexOf(name) >= 0);
	}

	/**
	 * Set the main controller
	 * @param {function(Type, Type): Type} cb
	 * @return {Command}
	 */
	'setController'(cb) {
		this.controller = cb;

		return this;
	}

	/**
	 * Defines what class new child instances should have if they're being instantiated by this object
	 * @param ClassObject
	 * @return {Command}
	 */
	'setNewChildClass'(ClassObject) {
		this[CHILD_CLASS] = ClassObject;

		return this;
	}
	/**
	 * Add a precontroller function that is ran before its own controller, or any of it's descendants precontrollers
	 * @param {function(Type, Type): Type} cb
	 * @return {Command}
	 */
	'addPreController'(cb) {
		this.preControllers.push(cb);

		return this;
	}

	/**
	 * Give command an alternative name
	 * @param {string} name
	 * @return {Command}
	 */
	'addAlias'(name) {
		this.aliases.push(name);

		return this;
	}

	/**
	 * Describe an option
	 * @param {Option|string} long - The identifying name of this option, unique for its ancestry
	 * @param {string} [short] - A one-character alias of this option, unique for its ancestry
	 * @param {string} [description]
	 * @param {boolean} [required] - If true, an omittance would throw an error
	 * @return {Command}
	 */
	'addOption'(long, short, description, required) {
		this.options.push(
			typeof long.getType === 'function' && long.getType() === 'option'
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
	 * @param {Parameter|string} name
	 * @param {string} [description]
	 * @param {boolean} [required]
	 * @return {Command}
	 */
	'addParameter'(name, description, required) {
		this.parameters.push(
			typeof name.getType === 'function' && name.getType() === 'parameter'
				? name
				: new Parameter(name).setDescription(description).isRequired(required)
		);

		return this;
	}

	/**
	 * Register a command as a child of this, and register this as parent of the child
	 * @TODO: Check if child is not in lineage of command, to avoid circularness
	 * @param {string|Command} name
	 * @param {function(Type, Type): Type} [controller]
	 * @return {Command} The child command
	 */
	'addCommand'(name, controller) {
		const child =
			typeof name.getType === 'function' && name.getType() === 'command'
				? name
				: new this[CHILD_CLASS](name, controller);

		child.parent = this;

		this.children.push(child);

		return child;
	}
}
