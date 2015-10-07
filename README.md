# ASK-NICELY
Easily create command-line applications by configuring commands, options and parameters that are supermagically parsed.

__Uses ECMAScript 6, so node v.4 or similar is required.__

## Example
An elaborate example can be found in `examples/application.annotated.js`. The following code is a functioning command-line application (that merely dumps whatever `Request` object was parsed from input):

```
let AskNicely = require('ask-nicely'),
	root = new AskNicely();

root.addOption('alpha', 'a');

root.addCommand('subcommand', (request) => console.log(request))
	.addOption('beta', 'b', null, true)
	.addParameter('gamma');

root.interpret(process.argv.slice(2))
	.then(request => request.execute())
	.catch(error => console.log(error));
```

Parsing input (`process.argv` in this example) would yield the following `Request` object in the relevant controller and precontrollers:

```
> node examples/application.microscopic.js -a
{
    command:    { /* the root command */ },
    options:    { alpha: true }
}

> node examples/application.microscopic.js subcommand paramValue --beta optValue
{
    command:    { /* the subcommand */ },
    parameters: { gamma: 'paramValue' },
    options:    { alpha: undefined, beta: 'optValue' }
}
```

## Advanced use
The Command methods `addOption` and `addParameter` either take a couple of strings and booleans, or an `Option` or `Parameter` instance respectively. Creating the instance of `Option` or `Parameter` first allows you to configure it with more advanced behaviour.

```
root.addOption(new root.Option('delta')
    .setShort('d')
    .setResolver((input) => database.find('users', input))
    .addValidator((user) => {
        if (user.username === 'wvbe')
            throw new Error('Get this sucka outta here');
    })
);
```

The resolver transforms flat text `input` into something different and is handled asynchronously if it returns a `Promise`. The validator in the example would throw a custom error if the resolved `user` object happens to have my username.

## Important classes
- Command
    - AskNicely (the "root" command, has added `interpret` method)
- Option
    - DeepOption (like `--config.username wvbe`)
    - IsolatedOption (like `--help`, prevents further input parsing)
- Parameter

## Important methods
- Command, Option and Parameter classes
    - `setDescription(description)`
- Option and Parameter classes
    - `isRequired(required)`
    - `addValidator(validator)`
    - `setResolver(resolver)`
    - `setDefault(arbitrary)`
- Option classes
    - `setShort(short)`
- Command classes
    - `addCommand(command|name[, controller])`
    - `addParameter(parameter|name[, description, required])`
    - `addOption(option|name[, short, description, required])`
    - `addPreController(controller)`
- AskNicely class
    - `interpret([input])`
- Request class
    - `execute([artibrary])`

## Behaviour
- Input for `Options` or `Parameters` can contain spaces if the input is wrapped in double-quotes (`--opt "My option"`)
- `Options` and `Parameters` accumulate as you go deeper from root into subcommands. In this way, any command can add scope to the underlying subcommands through the `Request` object
- Precontrollers (`Command#addPrecontroller()`) are accumulated as you go deeper into subcommands as well. When a command is ran, all of it's ancestors precontrollers are ran too. In this way, for example, a precontroller can determine if the execution chain should stop for a certain combination of options (by returning `false`).

## Release notes
- v1.0
    - Using ECMAScript 6
    - `Option`, `Parameter` and related classes increate configurability a thousandfold
    - Moved most parsing logic to individual classes that represent a syntax part
    - `AskNicely#interpret()` is no longer synchronous because of the ability to resolve values
    - Ditching a lot of useless methods that are not directly used for parsing or configuring, moving a lot of other stuff
    - Ditching `Command#isHungry()` and `Command#isGreedy()`
- v0.1
    - Initial release, pretty basic parsing with limited configurability

## Wishlist
- `DeepParameter`, similar to `DeepOption`, that make support for the following syntax possible: `git config user.name <name>`

## License
Copyright (c) 2015 Wybe Minnebo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

__THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.__

