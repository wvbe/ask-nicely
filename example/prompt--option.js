var Root = require('../Root'),
	root = new Root();

function optionTestCommand (request) {
	console.log(require('util').inspect(request.command.parameters, { depth: 2, colors: true}));
	console.log(require('util').inspect(request.parameters, { depth: 2, colors: true}));
}

root.addCommand('test', optionTestCommand)
	.addParameter(new root.Parameter('derp')
		.setDescription('Ja!')
		.addValidator(function (val) {
			if(val.indexOf('x') >= 0)
				throw new Error('derp parameter cannot contain x')
		})
		.isRequired(true))
	.setDescription('Test command which only dumps OPTION information')
	.addOption('alpha', 'a', 'Regular option (like the old API one)', true)
	.addOption('gamma', 'c', 'not required', false)
	.addOption('something', 'd', 'not required', false)
	.addOption(new root.Option('beta')
		.setShort('b')
		.setDescription('An option that must contain "x" and cannot contain "y"')
		.isRequired(function checkIfIsAwesome (value) {
			if(value === true)
				throw new Error('You can\'t just say awesome=true, you gotta LIVE DAT SHIT');

			if (value.indexOf('x') === -1)
				throw new Error('Your option must contain the letter "x"')
		})
		.addValidator(function anotherRandomCheck (value) {
			if (value.indexOf('y') >= 0)
				throw new Error('Your option cannot contain a "y"');
		}))
		.addParameter('third', 'third non-required param')
	.addCommand('test2', optionTestCommand)
		.addParameter('harr', 'nerf', true);

function test (str) {
	root.interpret(str)
		.then(function (res) {
			console.log();
			res.command = res.command.getRoute();
			console.log('TESTING ' + str);
			console.log(res);
			console.log();
		})
		.catch(function (err) {
			console.log();
			console.log('TESTING ' + str);
			console.log(err.stack);
			console.log();
		});
}



test();
test('test param1  -b x -ac');
//test('test param1 -a nerf -b x some test2 durka -c extra yotta');
//test('test param1 -ab y some test2 durka -c');

//test('test param1 test2 -ab awesomex param2');