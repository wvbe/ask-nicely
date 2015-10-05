var Request = require('./src/Request'),
	Option = require('./src/Option'),
	DeepOption = require('./src/DeepOption'),
	IsolatedOption = require('./src/IsolatedOption'),
	Parameter = require('./src/Parameter'),
	Command = require('./src/Command');

/**
 * @param {String} [name]
 * @param {Function} [controller]
 * @constructor
 */
function AskNicely (name, controller) {
	Command.call(this, name || 'AskNicely', controller);

	this.Command = Command;
	this.Option = Option;
	this.DeepOption = DeepOption;
	this.IsolatedOption = IsolatedOption;
	this.Parameter = Parameter;
}

AskNicely.prototype = Object.create(Command.prototype);
AskNicely.prototype.constructor = AskNicely;

/**
 * @param {String|Array<String>} [pieces]
 * @returns {Promise}
 */
AskNicely.prototype.interpret = function (pieces) {
	return Request.resolve(this, pieces || []);
};

module.exports = AskNicely;

module.exports.Command = Command;
module.exports.Option = Option;
module.exports.DeepOption = DeepOption;
module.exports.IsolatedOption = IsolatedOption;
module.exports.Parameter = Parameter;