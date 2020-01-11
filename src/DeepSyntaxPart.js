'use strict';

import symbols from './symbols';

function getValueFromPath(nameParts, obj) {
	return nameParts.reduce((o, part) => o && o[part] ? o[part] : undefined, obj);
}

// TECHNICAL DEBT
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

	static [symbols.createContributionToRequestObject] (propertyName, accumulated, value) {
		const contribution = {
			[propertyName]: {
				[this.name]: accumulated?.[propertyName]?.[this.name] || this.cloneDefault() || {}
			}
		};

		// console.log(contribution[propertyName][this.name]);

		if(value === undefined) {
			return contribution;
		}
		if (!value[0]?.split) {
			console.log(value, accumulated);
		}
		if (typeof value[0] === 'string')
		assignValueToPath(
			value[0].split('.'),
			contribution[propertyName][this.name],
			value[1]
		);

		// Object.assign(contribution[propertyName][this.name], contributedProp);

		// console.log('Contributed DeepSyntaxPath response ' + propertyName + '/' + this.name, contribution);
		return contribution;
	}
}
