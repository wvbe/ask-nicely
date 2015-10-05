var Option = require('./Option');

function DeepOption(name) {
	Option.call(this, name);
}

DeepOption.prototype = Object.create(Option.prototype);
DeepOption.prototype.constructor = DeepOption;

DeepOption.prototype.match = function (value) {
	return value.indexOf('--' + this.name + '.') === 0;
};

DeepOption.prototype.spliceInputFromParts = function (parts) {
	var optionName = parts.shift();

	optionName = optionName.substr(optionName.indexOf('.') + 1);

	return (parts[0] && parts[0].indexOf('-') !== 0 && parts[0])
		? [optionName, parts.shift()]
		: [optionName, true];
};

function assignValueToPath (nameParts, resultObj, value) {
	var name = nameParts.shift();

	resultObj[name] = nameParts.length
		? assignValueToPath(nameParts, resultObj[name] || {}, value)
		: value;

	return resultObj;
}

DeepOption.prototype.exportWithInput = function(request, value) {
	if(!request.options)
		request.options = {};

	request.options[this.name] = assignValueToPath(
		value[0].split('.'),
		request.options[this.name] || {},
		value[1]
	);
};


module.exports = DeepOption;