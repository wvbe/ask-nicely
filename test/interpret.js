var assert = require('assert'),
	Root = require('../Root'),
	app = new Root();

describe('interpret', function () {
	function compareInput(stringInput, route, options) {
		var inputRequest = app.interpret(stringInput);
		assert.deepEqual(
			inputRequest,
			app.request(route, options)
		);
	}

	it('if option is declared as TRUE multiple times, flatten', function () {
		compareInput(
			'a -a -a -a',
			['a'], { option1: true}
		);
	});

	it('otherwise, they would be accumulated', function () {
		compareInput(
			'a -a value -a value -a value',
			['a'], { option1: ['value', 'value', 'value'] }
		);
	});

	it('any TRUE values in between are ignored', function () {
		compareInput(
			'a -a value -a -a',
			['a'], {option1: 'value'}
		);
		compareInput(
			'a -a value1 -a value2 -a',
			['a'], { option1: ['value1', 'value2']}
		);
		compareInput(
			'a -a value1 -a -a value2',
			['a'], { option1: ['value1', 'value2']}
		);
	});

	it('using the long option name obsoletes the short option', function () {
		compareInput(
			'a -a value1 --option1 value2 -a',
			['a'], {option1: 'value2'}
		);
	});

	it('handles options enclosed by quotes which may contain spaces', function () {
		compareInput(
			'a -a "value 1" "value 2" value 3',
			['a'], {option1: ['value 1', 'value 2', 'value', '3']}
		);
	});
});