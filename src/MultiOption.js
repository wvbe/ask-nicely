'use strict';

import symbols from './symbols';
import Option from './Option';

const breakPartsOnPart = Symbol();
const breakPartsDefaultPattern = /^[-.*]/;

export default class MultiOption extends Option {
	constructor(name) {
		super(name);

		this.isInfinite();
	}

	// @todo: infinite arg as a callback
	// @amazement 4 years later: what the actual did i mean?
	'isInfinite'(infinite) {
		this[breakPartsOnPart] = infinite ? part => false : part => part.charAt(0) === '-';

		return this;
	}

	[breakPartsOnPart](part) {
		return part.match(breakPartsDefaultPattern);
	}

	[symbols.spliceInputFromParts](parts) {
		if (this.short && parts[0].charAt(1) === this.short) {
			parts[0] = '-' + parts[0].substr(2);

			if (parts[0] !== '-') return [];
		}

		parts.shift();

		const input = [];

		do {
			if (parts[0] === '-') {
				parts.shift();
				break;
			}
			if (!parts[0] || this[breakPartsOnPart](parts[0])) break;

			input.push(parts.shift());
		} while (parts.length > 0);

		return input;
	}

	[symbols.applyDefault](value, isUndefined) {
		if (value === undefined || !value.length) {
			if (this.useDefaultIfFlagMissing || !isUndefined) {
				value = this.cloneDefault() || [];
			}
		}

		if (this.required && (isUndefined || !value || !value.length)) return undefined;

		return value || [];
	}
	[symbols.createContributionToRequestObject](accumulated, value, isUndefined) {
		return {
			options: {
				[this.name]: (accumulated?.options?.[this.name] || []).concat(value)
			}
		};
	}
}
