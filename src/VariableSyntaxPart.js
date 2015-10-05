'use strict';

let NamedSyntaxPart = require('./NamedSyntaxPart');

class VariableSyntaxPart extends NamedSyntaxPart {
	/**
	 * @param {String} name
	 */
	constructor (name) {
		super(name);

		this.validators = [];
	}

	/**
	 * @param {boolean|Function} required - If this is a function, acts as a short-hand for addValidator() as well
	 * @returns {VariableSyntaxPart}
	 */
	isRequired (required) {
		this.required = !!required;

		return (typeof required === 'function')
			? this.addValidator(required)
			: this;
	}

	/**
	 * Add a validator function that would check the resolved value and is expected to throw if something's awry.
	 * @param {Function} validator
	 * @returns {VariableSyntaxPart}
	 */
	addValidator (validator) {
		this.validators.push(validator);
		return this;
	}

	/**
	 * Define a callback that can (asynchronously) resolve user input to a value. `resolver` can return any value
	 * synchronously or a Promise for that value.
	 * @param {Function} resolver
	 * @returns {VariableSyntaxPart}
	 */
	setResolver (resolver) {
		this.resolver = resolver;
		return this;
	}

	/**
	 * Set a value to fall back to in case VariableSyntaxPart was not defined (and not required)
	 * @param {*} value
	 * @returns {VariableSyntaxPart}
	 */
	setDefault (value) {
		this.default = value;
		return this;
	}

	validateInput (input) {
		if (this.required && input === undefined)
			throw new Error('"' + this.name + '" can not be undefined.');
	}

	validateValue (value) {
		this.validators.forEach(function (validator) {
			validator(value);
		});
	}
}

module.exports = VariableSyntaxPart;