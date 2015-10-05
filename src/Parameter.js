'use strict';

var VariableSyntaxPart = require('./VariableSyntaxPart');

class Parameter extends  VariableSyntaxPart {
	constructor (name) {
		super(name);
	}

	match (value) {
		return value.substr(0,1) !== '-';
	}

	updateTiersAfterMatch (tiers) {
		tiers.shift();
		return tiers;
	}

	spliceInputFromParts (parts) {
		return parts.shift();
	}

	exportWithInput (request, value) {
		if(!request.parameters)
			request.parameters = {};

		request.parameters[this.name] = value === undefined ? this.default : value;
	}
}

module.exports = Parameter;