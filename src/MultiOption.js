'use strict';

let symbols = require('./symbols'),
	Option = require('./Option');

class MultiOption extends Option {
	constructor (name) {
		super (name);
	}

	[symbols.spliceInputFromParts]  (parts) {
		if (this.short && parts[0].charAt(1) !== '-') {
			parts[0] = parts[0].replace(this.short, '');

			if(parts[0] !== '-')
				return [];
		}

		parts.shift();

		let input = [];

		do {
			if(!parts[0] || parts[0].length > 1 && parts[0].charAt(0) === '-')
				break;

			let part = parts.shift();

			if(!part || part === '-')
				break;

			input.push(part);

		} while(parts.length > 0);

		return input;
	}

	[symbols.exportWithInput] (request, value, isUndefined) {
		if(isUndefined)
			request.options[this.name] = this.cloneDefault() || [];
		request.options[this.name] = (request.options[this.name] || []).concat(value || []);
	}
}

module.exports = MultiOption;