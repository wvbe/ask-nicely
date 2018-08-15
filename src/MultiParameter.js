'use strict';

import symbols from './symbols';
import VariableSyntaxPart from './VariableSyntaxPart';

export default class Parameter extends  VariableSyntaxPart {
	constructor (name) {
		super(name);
	}

	[symbols.isMatchForPart] (value) {
		return value === '-' || value.substr(0,1) !== '-';
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		return tiers;
	}

	[symbols.spliceInputFromParts]  (parts) {
		const input = [];

		while (parts.length) {
			const value = parts.shift();

			if (parts[0] === '-' || !this[symbols.isMatchForPart](parts[0])) {
				break;
			}

			input.push(value);
		}

		return input;
	}


	[symbols.spliceInputFromParts] (parts) {
		let value = parts.shift();
		return value === '-'
			? undefined
			: value;
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
