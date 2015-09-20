var assert = require('assert'),
	Root = require('../Root'),
	app = new Root();

function cannotContainXyz(errCode, value) {
	if(typeof value === 'string' && value.indexOf('xyz') >= 0)
		throw new Error(errCode);
}

app
	.addCommand('a', function (req) {
		return req.options;
	})
		.addOption('option1', 'a', 'Option 1/A (required)', true)
		.addOption(new app.RequestData('option2')
			.setShort('b')
			.setDescription('Option 2/B (required)')
			.isRequired(true)
			.addValidator(cannotContainXyz.bind(null, 'option-validator')))
		.addOption(new app.RequestData('option3')
			.setShort('c')
			.setDescription('Option 3/C (not required)')
			.addValidator(cannotContainXyz.bind(null, 'option-validator')))
		.getParent()
	.addCommand('b')
		.addOption('parent', 'p', 'Parent option', true)
		.addCommand('ba')
			.isHungry()
			.addOption('long', 's', 'LONG and Short option');

describe('options', function () {
	var requestOptions = app.request(['a'], {
			a: true,
			b: true,
			setherhrj: true,
			'option1': 'priority'
		}).options,
		returnError;

	before(function (done) {
		app.request(['a'], {
			'option1': null
		}).execute().catch(function (error) {
			returnError = error;
		}).finally(done);
	});

	it('are renamed to their long names', function () {
		assert.strictEqual(requestOptions['option1'], 'priority'); // long name use has prio over short
		assert.strictEqual(requestOptions['option2'], true);
	});

	it('short-hand notation is removed', function () {
		assert.strictEqual(requestOptions['a'], undefined);
		assert.strictEqual(requestOptions['b'], undefined);
	});

	it('throws an error if required option is undefined', function () {
		assert.strictEqual(returnError instanceof Error, true);
		assert.strictEqual(returnError.message.indexOf('option1') >= 0, false); // Error message is *not* about null value
		assert.strictEqual(returnError.message.indexOf('option2') >= 0, true); // Erorr message *is* about undefined value
	});

	it('throws an error if a parent required option is undefined', function () {
		var req = app.request(['b', 'ba'], {
			s: null
		});
		assert.throws(function () {
			req.command.validateOptions(req.options);
		});
	});

	it('forgets undescribed options if command is not hungry', function () {
		assert.strictEqual(Object.keys(requestOptions).length, 2);
	});


	it('merges with parent options', function () {
		var opts = app.request(['b', 'ba'], {
			s: 'child',
			p: 'parent'
		}).options;

		assert.strictEqual(opts.long, 'child');
		assert.strictEqual(opts.parent, 'parent');
	});

	it('merges with undescribed options if command is hungry', function () {
		var opts = app.request(['b', 'ba'], {
			s: 'underwrite',
			long: 'overwrite',
			random: 'kept'
		}).options;

		assert.strictEqual(opts.s, undefined);
		assert.strictEqual(opts.long, 'overwrite');
		assert.strictEqual(opts.random, 'kept');
	});


	it('can be configured with custom validators', function () {
		assert.throws(function () {
			app.request(['a'], { a: 'whatever', b: 'containsxyz', c: undefined }).validate();
		}, function (err) { return err.message === 'option-validator'; });
	});
});