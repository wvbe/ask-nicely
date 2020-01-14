'use strict';

import symbols from './symbols';
import VariableSyntaxPart from './VariableSyntaxPart';

export default class Parameter extends  VariableSyntaxPart {
	constructor (name) {
		super(name);

		this.isParameter = true;
	}

	[symbols.isMatchForPart] (value) {
		return value === '-' || value.substr(0,1) !== '-';
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		tiers.ordered.shift();
		return tiers;
	}

	[symbols.spliceInputFromParts] (parts) {
		let value = parts.shift();
		return value === '-'
			? undefined
			: value;
	}

	[symbols.spliceInputDetailsFromParts] (parts) {
		let value = parts.shift();
		return {
			part: parts[0],
			value: value === '-'
				? undefined
				: value,
			type: 'PARAMETER'
		};
	}

	[symbols.exportWithInput] (request, value) {
		if (!request.parameters) {
			request.parameters = {};
		}

		request.parameters[this.name] = value === undefined
			? this.cloneDefault()
			: value;
	}

	getType () {
		return 'parameter';
	}
}
