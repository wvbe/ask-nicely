'use strict';

import symbols from './symbols';
import DeepSyntaxPart from './DeepSyntaxPart';
import Option from './Option';

export default class DeepOption extends Option {
	constructor(name) {
		super(name);
	}

	[symbols.isMatchForPart](value) {
		return value.indexOf(`--${this.name}.`) === 0;
	}

	[symbols.spliceInputFromParts](parts) {
		return DeepSyntaxPart[symbols.spliceInputFromParts].call(this, parts);
	}

	[symbols.createContributionToRequestObject](...args) {
		// Inherit the behaviour of DeepSyntaxPart with a predetermined propertyName
		return DeepSyntaxPart[symbols.createContributionToRequestObject].call(
			this,
			'options',
			...args
		);
	}
}
