'use strict';

let symbols = require('./symbols'),
	VariableSyntaxPart = require('./VariableSyntaxPart');


class Option extends VariableSyntaxPart {

	constructor (name) {
		super(name);
	}

	[symbols.isMatchForPart] (value) {
		return (value.indexOf('-') !== 0)
			? false
			: (this.short && value.substr(1,1) !== '-' && value.substr(1).indexOf(this.short) >= 0)
			|| value === `--${this.name}`;
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		return tiers;
	}

	[symbols.spliceInputFromParts]  (parts) {
		if (this.short && parts[0].substr(1,1) !== '-') {
			parts[0] = parts[0].replace(this.short, '');

			// if all that' remains is a dash
			if(parts[0] !== '-')
				return this.cloneDefault() || true;
		}

		parts.shift();

		// if value is a dash, set actual value to TRUE
		if(parts[0] === '-') {
			parts.shift();
			return this.cloneDefault() || true;
		}

		return (parts[0] && parts[0].indexOf('-') !== 0 && parts[0])
			? parts.shift()
			: this.cloneDefault() || true;
	}

	[symbols.exportWithInput] (request, value) {
		if(!request.options)
			request.options = {};

		request.options[this.name] = value === undefined ? this.cloneDefault() : value;
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