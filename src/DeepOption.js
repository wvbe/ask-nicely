'use strict';

import symbols from './symbols';
import DeepSyntaxPart from './DeepSyntaxPart';
import Option from './Option';

export default class DeepOption extends Option {
	constructor (name) {
		super (name);
	}

	[symbols.isMatchForPart] (value) {
		return value.indexOf(`--${this.name}.`) === 0;
	}

	[symbols.spliceInputFromParts] (parts) {
		return DeepSyntaxPart[symbols.spliceInputFromParts].call(this, parts);
	}

	[symbols.exportWithInput] (request, value) {
		return DeepSyntaxPart[symbols.exportWithInput].call(this, 'options', request, value);
	}
}
