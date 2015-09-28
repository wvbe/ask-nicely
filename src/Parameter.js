var VariableSyntaxPart = require('./VariableSyntaxPart');

function ParameterSyntaxPart(name) {
	VariableSyntaxPart.call(this, name);
}

ParameterSyntaxPart.prototype = Object.create(VariableSyntaxPart.prototype);
ParameterSyntaxPart.prototype.constructor = ParameterSyntaxPart;

ParameterSyntaxPart.prototype.match = function (value) {
	return value.substr(0,1) !== '-';
};

ParameterSyntaxPart.prototype.updateTiersAfterMatch = function (tiers) {
	tiers.shift();
	return tiers;
};

ParameterSyntaxPart.prototype.spliceInputFromParts = function (parts) {
	return parts.shift();
};

ParameterSyntaxPart.prototype.exportWithInput = function(request, value) {
	if(!request.parameters)
		request.parameters = {};

	request.parameters[this.name] = value;
};


module.exports = ParameterSyntaxPart;