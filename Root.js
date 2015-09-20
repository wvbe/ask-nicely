var Request = require('./src/Request'),
	RequestData = require('./src/RequestData'),
	Command = require('./src/Command');

/**
 * The Command that serves as a root for the command structure. Includes the request() helper method for easily
 * generating a Request that has the targeted child Command in context. Usually doesn't have a name or controller,
 * and per definition does not have a parent.
 * @TODO: Test what happens on Root.setParent(), or disable this method for Root
 * @param {String} [name]
 * @param {Function} [controller]
 * @constructor
 */
function Root (name, controller) {
	Command.call(this, name, controller);

	this.RequestData = RequestData;
}

Root.prototype = Object.create(Command.prototype);
Root.prototype.constructor = Root;

Root.prototype.request = function (route, options) {
	return new Request(this, route, options);
};

Root.prototype.interpret = function (pieces) {
	return new Request.fromInput(this, pieces);
};

module.exports = Root;

module.exports.Command = Command;
module.exports.Request = Request;
module.exports.RequestData = RequestData;