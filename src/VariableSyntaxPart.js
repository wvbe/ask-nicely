var NamedSyntaxPart = require('./NamedSyntaxPart');

function VariableSyntaxPart(name) {
	NamedSyntaxPart.call(this, name);

	this.validators = [];
}

VariableSyntaxPart.prototype = Object.create(NamedSyntaxPart.prototype);
VariableSyntaxPart.prototype.constructor = VariableSyntaxPart;

/**
 * @param {boolean|Function} required - If this is a function, acts as a short-hand for addValidator() as well
 * @returns {VariableSyntaxPart}
 */
VariableSyntaxPart.prototype.isRequired = function (required) {
	this.required = !!required;

	return (typeof required === 'function')
		? this.addValidator(required)
		: this;
};

VariableSyntaxPart.prototype.addValidator = function (validator) {
	this.validators.push(validator);
	return this;
};

VariableSyntaxPart.prototype.setResolver = function (resolver) {
	this.resolver = resolver;
	return this;
};
VariableSyntaxPart.prototype.setDefault = function (value) {
	this.default = value;
	return this;
};

// Ran before input is resolved (possibly asynchronously) into value
VariableSyntaxPart.prototype.validateInput = function (input) {
	if (this.required && input === undefined)
		throw new Error('"' + this.name + '" can not be undefined.');
};

// Ran after value was resolved (possibly asynchronously) from input
VariableSyntaxPart.prototype.validateValue = function (value) {
	this.validators.forEach(function (validator) {
		validator(value);
	});
};
module.exports = VariableSyntaxPart;