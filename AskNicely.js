'use strict';

let interpreter = require('./src/interpreter'),

	CLASS_EXPORT = {
			Request:        require('./src/Request'),
			Command:        require('./src/Command'),
			Option:         require('./src/Option'),
			MultiOption:    require('./src/MultiOption'),
			DeepOption:     require('./src/DeepOption'),
			IsolatedOption: require('./src/IsolatedOption'),
			Parameter:      require('./src/Parameter'),
			DeepParameter:  require('./src/DeepParameter')
		};

class AskNicely extends CLASS_EXPORT.Command {
	/**
	 * @param {String} [name]
	 * @param {Function} [controller]
	 * @constructor
	 */
	constructor (name, controller) {
		super(name, controller);

		Object.assign(this, CLASS_EXPORT);
	}

	/**
	 * @param {String|Array<String>} [parts]
	 * @param {Object} [request] An existing Request, if you do not want to make a new one if you want to re-use it
	 * @returns {Promise}
	 */
	interpret (parts, request) {
		return interpreter(this, parts, request || new CLASS_EXPORT.Request());
	}
}

module.exports = Object.assign(AskNicely, CLASS_EXPORT);