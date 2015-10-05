'use strict';

var VariableSyntaxPart = require('./VariableSyntaxPart');


class Option extends VariableSyntaxPart {

	constructor (name) {
		super(name);
	}

	match (value) {
		if(value.indexOf('-') !== 0)
			return false;
		return (this.short
			&& value.substr(1,1) !== '-'
			&& value.substr(1).indexOf(this.short) >= 0)
			|| value === '--' + this.name;
	}

	updateTiersAfterMatch (tiers) {
		return tiers;
	}

	spliceInputFromParts  (parts) {
		if (this.short && parts[0].substr(1,1) !== '-') {
			parts[0] = parts[0].replace(this.short, '');

			// if all that' remains is a dash
			if(parts[0] !== '-')
				return this.default || true;
		}

		parts.shift();

		// if value is a dash, set actual value to TRUE
		if(parts[0] === '-') {
			parts.shift();
			return this.default || true;
		}

		return (parts[0] && parts[0].indexOf('-') !== 0 && parts[0])
			? parts.shift()
			: this.default || true;
	}

	exportWithInput (request, value) {
		if(!request.options)
			request.options = {};

		request.options[this.name] = value === undefined ? this.default : value;
	}

	setShort (short) {
		this.short = short;
		return this;
	}
}

module.exports = Option;