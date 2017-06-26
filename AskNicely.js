'use strict';

import interpreter from './src/interpreter';
import Command from './src/Command';
import Request from './src/Request';

export class Root extends Command {
	/**
	 * @param {String} [name]
	 * @param {Function} [controller]
	 * @constructor
	 */
	constructor (name, controller) {
		super(name, controller);
	}

	/**
	 * @param {String|Array<String>} [parts]
	 * @param {Object} [request] An existing Request, if you do not want to make a new one if you want to re-use it
	 * @returns {Promise}
	 */
	execute (parts, request, ...args) {
		return interpreter(this, parts, request || new Request(), true, args)
			.then(request => request.command.run.apply(request.command, [request, ...args]));
	}

	parse (parts, request, ...args) {
		return interpreter(this, parts, request || new Request(), false, args);
	}
}

export { Command };
export { Request };

export { default as Option } from './src/Option';
export { default as MultiOption } from './src/MultiOption';
export { default as DeepOption } from './src/DeepOption';
export { default as IsolatedOption } from './src/IsolatedOption';
export { default as Parameter } from './src/Parameter';
export { default as DeepParameter } from './src/DeepParameter';
export { default as InputError } from './src/InputError';
