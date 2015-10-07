'use strict';

let AskNicely = require('../AskNicely'),
	root = new AskNicely();


root.addCommand('dump', function (request) {
	console.log(request);
})
	.addOption('opt', 'o')
	.addParameter('param');

root.interpret(process.argv.slice(2))
	.then(request => request.execute())
	.catch(error => console.log(error));