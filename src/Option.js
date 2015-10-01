var VariableSyntaxPart = require('./VariableSyntaxPart');

function OptionSyntaxPart(name) {
	VariableSyntaxPart.call(this, name);
}

OptionSyntaxPart.prototype = Object.create(VariableSyntaxPart.prototype);
OptionSyntaxPart.prototype.constructor = OptionSyntaxPart;

OptionSyntaxPart.prototype.match = function (value) {
	if(value.indexOf('-') !== 0)
		return false;
	return (this.short
		&& value.substr(1,1) !== '-'
		&& value.substr(1).indexOf(this.short) >= 0)
		|| value === '--' + this.name;
};
OptionSyntaxPart.prototype.updateTiersAfterMatch = function (tiers) {
	return tiers;
};

OptionSyntaxPart.prototype.spliceInputFromParts = function (parts) {
	if (this.short && parts[0].substr(1,1) !== '-') {
		parts[0] = parts[0].replace(this.short, '');

		// if all that' remains is a dash
		if(parts[0] !== '-')
			return true;
	}

	parts.shift();

	// if value is a dash, set actual value to TRUE
	if(parts[0] === '-') {
		parts.shift();
		return true;
	}

	return (parts[0] && parts[0].indexOf('-') !== 0 && parts[0])
		? parts.shift()
		: true;
};

OptionSyntaxPart.prototype.exportWithInput = function(request, value) {
	if(!request.options)
		request.options = {};

	request.options[this.name] = value;
};



OptionSyntaxPart.prototype.setShort = function (short) {
	this.short = short;
	return this;
};

module.exports = OptionSyntaxPart;