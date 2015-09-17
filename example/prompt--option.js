var Root = require('../Root'),
	root = new Root();

function optionTestCommand (request) {
	console.log(require('util').inspect(response.command.options, { depth: 2, colors: true}));
}

root.addCommand('test', optionTestCommand)
	.setDescription('Test command which only dumps OPTION information')
	.addOption('alpha')
		.setDescription('Regular option (like the old API one)')
		.setRequired(true)
		.setShort('a')
		.next()
	.addOption('beta')
		.setDescription('An option that must contain "x" and cannot contain "y"')
		.setRequired(function checkIfIsAwesome (value) {
			if (value.indexOf('x') === -1)
				throw new Error('Your option must contain the letter "x"')
		})
		.addValidator(function anotherRandomCheck (value) {
			if (value.indexOf('y') >= 0)
				throw new Error('Your option cannot contain a "y"');
		})
		.next()
	;


root
	.interpret(process.argv.slice(2))
	.execute()
	.then(function(response) {
		console.log(require('util').inspect(response.options, { depth: 2, colors: true}));
	})
	.catch(function (error) {
		console.log(error.stack || error.message || error);
	});

