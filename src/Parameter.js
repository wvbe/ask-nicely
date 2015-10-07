'use strict';

let symbols = require('./symbols'),
	VariableSyntaxPart = require('./VariableSyntaxPart');

class Parameter extends  VariableSyntaxPart {
	constructor (name) {
		super(name);
	}

	[symbols.isMatchForPart] (value) {
		return value.substr(0,1) !== '-';
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		tiers.shift();
		return tiers;
	}

	[symbols.spliceInputFromParts] (parts) {
		return parts.shift();
	}

	[symbols.exportWithInput] (request, value) {
		if(!request.parameters)
			request.parameters = {};

		request.parameters[this.name] = value === undefined ? this.default : value;
	}
}

module.exports = Parameter;