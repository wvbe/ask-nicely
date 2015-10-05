'use strict';

var Option = require('./Option');

function assignValueToPath (nameParts, resultObj, value) {
	var name = nameParts.shift();

	resultObj[name] = nameParts.length
		? assignValueToPath(nameParts, resultObj[name] || {}, value)
		: value;

	return resultObj;
}

class DeepOption extends Option {
	constructor (name) {
		super (name);
	}

	match (value) {
		return value.indexOf('--' + this.name + '.') === 0;
	}

	spliceInputFromParts (parts) {
		var optionName = parts.shift();

		optionName = optionName.substr(optionName.indexOf('.') + 1);

		return (parts[0] && parts[0].indexOf('-') !== 0 && parts[0])
			? [optionName, parts.shift()]
			: [optionName, this.default || true];
	}


	exportWithInput (request, value) {
		if(!request.options)
			request.options = {};

		if(!request.options[this.name])
			request.options[this.name] = this.default || {};

		if(value === undefined) {
			return;
		}

		request.options[this.name] = assignValueToPath(
			value[0].split('.'),
			request.options[this.name] || {},
			value[1]
		);
	}
}

module.exports = DeepOption;