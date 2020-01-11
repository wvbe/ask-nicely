'use strict';

import symbols from './symbols';
import VariableSyntaxPart from './VariableSyntaxPart';

export default class Parameter extends VariableSyntaxPart {
	constructor(name) {
		super(name);
	}

	[symbols.isMatchForPart](value) {
		return value === '-' || value.substr(0, 1) !== '-';
	}

	[symbols.updateTiersAfterMatch](tiers) {
		tiers.ordered.shift();
		return tiers;
	}

	[symbols.spliceInputFromParts](parts) {
		const value = parts.shift();
		return value === '-' ? undefined : value;
	}

	[symbols.createContributionToRequestObject](accumulated, value) {
		return {
			parameters: {
				[this.name]: value === undefined ? this.cloneDefault() : value
			}
		};
	}

	'getType'() {
		return 'parameter';
	}
}
