'use strict';

import symbols from './symbols';
import DeepSyntaxPart from './DeepSyntaxPart';
import Parameter from './Parameter';

export default class DeepParameter extends Parameter {
	constructor (name) {
		super (name);
	}

	[symbols.isMatchForPart] (value) {
		return value.indexOf(`${this.name}.`) === 0;
	}

	[symbols.updateTiersAfterMatch] (tiers) {
		return tiers;
	}

	[symbols.spliceInputFromParts] (parts) {
		return DeepSyntaxPart[symbols.spliceInputFromParts].call(this, parts);
	}

	[symbols.exportWithInput] (request, value) {
		return DeepSyntaxPart[symbols.exportWithInput].call(this, 'parameters', request, value);
	}
}
