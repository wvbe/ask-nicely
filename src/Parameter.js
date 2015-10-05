var VariableSyntaxPart = require('./VariableSyntaxPart');

function Parameter(name) {
	VariableSyntaxPart.call(this, name);
}

Parameter.prototype = Object.create(VariableSyntaxPart.prototype);
Parameter.prototype.constructor = Parameter;

Parameter.prototype.match = function (value) {
	return value.substr(0,1) !== '-';
};

Parameter.prototype.updateTiersAfterMatch = function (tiers) {
	tiers.shift();
	return tiers;
};

Parameter.prototype.spliceInputFromParts = function (parts) {
	return parts.shift();
};

Parameter.prototype.exportWithInput = function(request, value) {
	if(!request.parameters)
		request.parameters = {};

	request.parameters[this.name] = value;
};


module.exports = Parameter;