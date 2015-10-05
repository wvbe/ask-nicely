'use strict';

var NamedSyntaxPart = require('./NamedSyntaxPart');

class VariableSyntaxPart extends NamedSyntaxPart {
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

	addValidator (validator) {
		this.validators.push(validator);
		return this;
	}

	setResolver (resolver) {
		this.resolver = resolver;
		return this;
	}
	setDefault (value) {
		this.default = value;
		return this;
	}

// Ran before input is resolved (possibly asynchronously) into value
	validateInput (input) {
		if (this.required && input === undefined)
			throw new Error('"' + this.name + '" can not be undefined.');
	}

// Ran after value was resolved (possibly asynchronously) from input
	validateValue (value) {
		this.validators.forEach(function (validator) {
			validator(value);
		});
	}
}

module.exports = VariableSyntaxPart;