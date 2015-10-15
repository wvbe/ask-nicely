'use strict';

var interpreter = require('./src/interpreter'),
	Request = require('./src/Request'),
	exposedClasses = {
			Command:        require('./src/Command'),
			Option:         require('./src/Option'),
			DeepOption:     require('./src/DeepOption'),
			IsolatedOption: require('./src/IsolatedOption'),
			Parameter:      require('./src/Parameter'),
			DeepParameter:  require('./src/DeepParameter')
		};

class AskNicely extends exposedClasses.Command {
	/**
	 * @param {String} [name]
	 * @param {Function} [controller]
	 * @constructor
	 */
	constructor (name, controller) {
		super(name, controller);

		Object.assign(this, exposedClasses);
	}

	/**
	 * @param {String|Array<String>} [parts]
	 * @returns {Promise}
	 */
	interpret (parts) {
		return interpreter(this, parts, new Request());
	}
}

module.exports = Object.assign(AskNicely, exposedClasses);