'use strict';

let AskNicely = require('../AskNicely'),
	root = new AskNicely();

root.addOption('alpha', 'a');

root.addCommand('subcommand', (request) => console.log(request))
	.addOption('beta', 'b', null, true)
	.addParameter('gamma');

root.interpret(process.argv.slice(2))
	.then(request => request.execute())
	.catch(error => console.log(error));