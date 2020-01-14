'use strict';

import symbols from './symbols';

function getValueFromPath(nameParts, obj) {
	return nameParts.reduce((o, part) => o && o[part] ? o[part] : undefined, obj);
}

function assignValueToPath (nameParts, resultObj, value) {
	let name = nameParts.shift();

	resultObj[name] = nameParts.length
		? assignValueToPath(nameParts, resultObj[name] || {}, value)
		: value;

	return resultObj;
}

export default class DeepSyntaxPart {
	static [symbols.spliceInputFromParts] (parts) {
		let deepName = parts.shift();

		deepName = deepName.substr(deepName.indexOf('.') + 1);

		// if value is a dash, set actual value to TRUE
		if(parts[0] === '-') {
			parts.shift();
			return [deepName, getValueFromPath(deepName.split('.'), this.cloneDefault()) || true];
		}

		return (parts[0] && parts[0].indexOf('-') !== 0)
			? [deepName, parts.shift()]
			: [deepName, getValueFromPath(deepName.split('.'), this.cloneDefault()) || true];
	}

	static [symbols.spliceInputDetailsFromParts] (parts) {
		let deepName = parts.shift();

		deepName = deepName.substr(deepName.indexOf('.') + 1);

		// if value is a dash, set actual value to TRUE
		if(parts[0] === '-') {
			parts.shift();
			return [deepName, getValueFromPath(deepName.split('.'), this.cloneDefault()) || true];
		}

		return {
			part: parts[0],
			value: (parts[0] && parts[0].indexOf('-') !== 0)
				? [deepName, parts.shift()]
				: [deepName, getValueFromPath(deepName.split('.'), this.cloneDefault()) || true],
			type: 'DEEP_SYNTAX'
		};
	}

	static [symbols.exportWithInput] (propertyName, request, value) {
		if(!request[propertyName])
			request[propertyName] = {};

		if(!request[propertyName][this.name])
			request[propertyName][this.name] = this.cloneDefault() || {};

		if(value === undefined) {
			return;
		}

		request[propertyName][this.name] = assignValueToPath(
			value[0].split('.'),
			request[propertyName][this.name],
			value[1]
		);
	}
}
