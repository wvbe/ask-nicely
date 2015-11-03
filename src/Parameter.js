'use strict';

let symbols = require('./symbols'),
	VariableSyntaxPart = require('./VariableSyntaxPart');

class Parameter extends  VariableSyntaxPart {
	constructor (name) {
		super(name);
	}

	[symbols.isMatchForPart] (value) {
		return value === '-' || value.substr(0,1) !== '-';
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		tiers.shift();
		return tiers;
	}

	[symbols.spliceInputFromParts] (parts) {
		let value = parts.shift();
		return value === '-' ? undefined : value;
	}

	[symbols.exportWithInput] (request, value) {
		request.parameters[this.name] = value === undefined ? this.cloneDefault() : value;
	}
}

module.exports = Parameter;