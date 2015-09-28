function NamedSyntaxPart (name) {
	this.name = name;
}

NamedSyntaxPart.prototype.match = function(part) {
	throw new Error('Not implemented.');
};
NamedSyntaxPart.prototype.updateTiersAfterMatch = function(tiers) {
	throw new Error('Not implemented.');
};
NamedSyntaxPart.prototype.spliceInputFromParts = function(parts) {
	throw new Error('Not implemented.');
};
NamedSyntaxPart.prototype.exportWithInput = function(request, value) {
	throw new Error('Not implemented.');
};
NamedSyntaxPart.prototype.validateInput = function (input) {
	return true;
};
NamedSyntaxPart.prototype.validateValue = function (input) {
	return true;
};
NamedSyntaxPart.prototype.setDescription = function (description) {
	this.description = description;
	return this;
};


module.exports = NamedSyntaxPart;