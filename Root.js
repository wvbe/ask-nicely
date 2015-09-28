var Request = require('./src/Request'),
	Option = require('./src/Option'),
	Parameter = require('./src/Parameter'),
	Command = require('./src/Command');

/**
 * @param {String} [name]
 * @param {Function} [controller]
 * @constructor
 */
function Root (name, controller) {
	Command.call(this, name || 'root', controller);

	this.Command = Command;
	this.Option = Option;
	this.Parameter = Parameter;
}

Root.prototype = Object.create(Command.prototype);
Root.prototype.constructor = Root;

/**
 * @param {String|Array<String>} [pieces]
 * @returns {Promise}
 */
Root.prototype.interpret = function (pieces) {
	return Request.resolve(this, pieces || []);
};

module.exports = Root;

module.exports.Command = Command;
module.exports.Option = Option;
module.exports.Parameter = Parameter;