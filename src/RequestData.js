var q = require('q');

function RequestData(name) {
	this.name = name;
	this.validators = [];
}

RequestData.prototype.setDescription = function (description) {
	this.description = description;
	return this;
};
RequestData.prototype.setShort = function (short) {
	this.short = short;
	return this;
};

/**
 * @param {boolean|Function} required - If this is a function, acts as a short-hand for addValidator() as well
 * @returns {RequestData}
 */
RequestData.prototype.setRequired = function (required) {
	this.required = !!required;

	return (typeof required === 'function')
		? this.addValidator(required)
		: this;
};

RequestData.prototype.addValidator = function (validator) {
	this.validators.push(validator);
	return this;
};

// RequestData#setNumeric()
// RequestData#alwaysAsPrimitive()
// RequestData#alwaysAsArray()
// RequestData#asBoolean()
// RequestData#asNumeric()

RequestData.prototype.forCommand = function (command) {
	this._cmd = command;
	return this;
};

RequestData.prototype.validate = function (value) {
	if (this.required && value === undefined)
		throw new Error('Wrong argument, option "' + this.name + '" can not be undefined.');

	this.validators.forEach(function (validator) {
		validator(value);
	});
};
RequestData.prototype.next = function () {
	return this._cmd;
};

module.exports = RequestData;