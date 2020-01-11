'use strict';

import symbols from './symbols';
import VariableSyntaxPart from './VariableSyntaxPart';

export default class Option extends VariableSyntaxPart {
	constructor(name) {
		super(name);
	}

	[symbols.isMatchForPart](value) {
		// return true if value is a (grouped) short, or long notation
		return value.indexOf('-') !== 0
			? false
			: (this.short && value.charAt(1) === this.short) || value === `--${this.name}`;
	}

	[symbols.updateTiersAfterMatch](tiers) {
		// do not change tiers because options are always recognizable, and may occur in input again
		return tiers;
	}

	[symbols.spliceInputFromParts](parts) {
		// if this is a short notation (for one or more flags)
		if (this.short && parts[0].charAt(1) === this.short) {
			// remove the flag signifier from group
			parts[0] = '-' + parts[0].substr(2); // replace(this.short, '');

			// if the group is not empty, stop parsing this option
			if (parts[0] !== '-') return;
		}

		// Stop caring about the flag signifier
		parts.shift();

		// if value is a dash, stop parsing
		if (parts[0] === '-') {
			parts.shift();
			return;
		}

		// use next input part if it is not another option
		if (parts[0] && parts[0].charAt(0) !== '-') return parts.shift();
	}

	[symbols.applyDefault](value, isUndefined) {
		if (this.required && isUndefined) return undefined;

		if (value === undefined) {
			if (this.useDefaultIfFlagMissing || !isUndefined) {
				return this.cloneDefault() || true;
			}
		}
		return value;
	}

	[symbols.createContributionToRequestObject](accumulated, value, isUndefined) {
		return {
			options: {
				[this.name]: value
			}
		};
	}

	'getType'() {
		return 'option';
	}

	/**
	 *
	 * @param value
	 * @param {boolean} [useDefaultIfFlagMissing] - Ignored when option is also required -- will fail validation
	 * @return {Option}
	 */
	'setDefault'(value, useDefaultIfFlagMissing) {
		this.default = value;
		this.useDefaultIfFlagMissing = !!useDefaultIfFlagMissing;
		return this;
	}

	/**
	 * Set a one-letter alias for a flag.
	 * @param {string} short
	 * @return {Option}
	 */
	'setShort'(short) {
		this.short = short;
		return this;
	}
}
