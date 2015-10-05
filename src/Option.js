var VariableSyntaxPart = require('./VariableSyntaxPart');

function Option(name) {
	VariableSyntaxPart.call(this, name);
}

Option.prototype = Object.create(VariableSyntaxPart.prototype);
Option.prototype.constructor = Option;

Option.prototype.match = function (value) {
	if(value.indexOf('-') !== 0)
		return false;
	return (this.short
		&& value.substr(1,1) !== '-'
		&& value.substr(1).indexOf(this.short) >= 0)
		|| value === '--' + this.name;
};
Option.prototype.updateTiersAfterMatch = function (tiers) {
	return tiers;
};

Option.prototype.spliceInputFromParts = function (parts) {
	if (this.short && parts[0].substr(1,1) !== '-') {
		parts[0] = parts[0].replace(this.short, '');

		// if all that' remains is a dash
		if(parts[0] !== '-')
			return this.default || true;
	}

	parts.shift();

	// if value is a dash, set actual value to TRUE
	if(parts[0] === '-') {
		parts.shift();
		return this.default || true;
	}

	return (parts[0] && parts[0].indexOf('-') !== 0 && parts[0])
		? parts.shift()
		: this.default || true;
};

Option.prototype.exportWithInput = function(request, value) {
	if(!request.options)
		request.options = {};

	request.options[this.name] = value === undefined ? this.default : value;
};



Option.prototype.setShort = function (short) {
	this.short = short;
	return this;
};

module.exports = Option;