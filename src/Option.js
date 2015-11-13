'use strict';

let symbols = require('./symbols'),
	VariableSyntaxPart = require('./VariableSyntaxPart');

class Option extends VariableSyntaxPart {
	constructor (name) {
		super(name);
	}

	[symbols.isMatchForPart] (value) {
		// return true if value is a (grouped) short, or long notation
		return (value.indexOf('-') !== 0)
			? false
			: (this.short && value.substr(1,1) !== '-' && value.substr(1).indexOf(this.short) >= 0)
			|| value === `--${this.name}`;
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		// do not change tiers because options are always recognizable, and may occur in input again
		return tiers;
	}

	[symbols.spliceInputFromParts]  (parts) {
		// if this is a short notation (for one or more flags)
		if (this.short && parts[0].charAt(1) !== '-') {
			// remove the flag signifier from group
			parts[0] = parts[0].replace(this.short, '');

			// if the group is not empty, input is DEFAULT or TRUE
			if(parts[0] !== '-')
				return this.cloneDefault() || true;
		}

		// Stop caring about the flag signifier
		parts.shift();

		// if value is a dash, set actual value to DEFAULT or TRUE
		if(parts[0] === '-') {
			parts.shift();
			return this.cloneDefault() || true;
		}

		// use next input part if it is not another option, or DEFAULT or TRUE
		return (parts[0] && parts[0].charAt(0) !== '-')
			? parts.shift()
			: this.cloneDefault() || true;
	}

	[symbols.exportWithInput] (request, value) {
		request.options[this.name] = value === undefined
			? this.cloneDefault() || true
			: value;
	}

	/**
	 * Set a one-letter alias for a flag.
	 * @param {String} short
	 * @returns {Option}
	 */
	setShort (short) {
		this.short = short;
		return this;
	}
}

module.exports = Option;