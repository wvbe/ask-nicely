'use strict';

let symbols = require('./symbols'),
	Option = require('./Option');

const breakPartsOnPart = Symbol(),
	breakPartsDefaultPattern = /^[-.*]/;

class MultiOption extends Option {
	constructor (name) {
		super (name);

		this.isInfinite();
	}

	// @todo: infinite arg as a callback
	isInfinite (infinite) {
		if (!infinite)
			infinite = breakPartsDefaultPattern;

		this[breakPartsOnPart] = (infinite instanceof RegExp)
			? part => part.match(infinite)
			: part => false;

		return this;
	}

	[breakPartsOnPart] (part) {
		return part.match(breakPartsDefaultPattern);
	}

	[symbols.spliceInputFromParts]  (parts) {
		if (this.short && parts[0].charAt(1) === this.short) {
			parts[0] = '-' + parts[0].substr(2);//parts[0].replace(this.short, '');

			if(parts[0] !== '-')
				return [];
		}

		parts.shift();

		let input = [];

		do {
			if(parts[0] === '-') {
				parts.shift();
				break;
			}
			if(!parts[0] || this[breakPartsOnPart](parts[0]))
				break;

			input.push(parts.shift());

		} while(parts.length > 0);

		return input;
	}

	[symbols.applyDefault] (value, isUndefined) {
		if(value === undefined || !value.length) {
			if(this.useDefaultIfFlagMissing || !isUndefined) {
				value = this.cloneDefault() || [];
			}
		}

		if(this.required && (isUndefined || !value || !value.length))
			return undefined;

		return value || [];
	}
	[symbols.exportWithInput] (request, value, isUndefined) {
		request.options[this.name] = (request.options[this.name] || []).concat(value);
	}
}

module.exports = MultiOption;