# ASK-NICELY
Easily create command-line applications by configuring commands, options and parameters that are supermagically parsed.

__Uses ECMAScript 6, so node v.4 or similar is required.__

Ask Nicely is different from parsers like `minimist` because it interprets input based on what's configured, rather
than syntax alone.

## Example
An elaborate example can be found in `examples/application.annotated.js`. The following code is a functioning
command-line application (that merely dumps whatever `Request` object was parsed from input):

```
let AskNicely = require('ask-nicely'),
	root = new AskNicely();

root.addOption('alpha', 'a');

root.addCommand('subcommand', request => console.log(request))
	.addOption('beta', 'b', null, true)
	.addParameter('gamma');

root.interpret(process.argv.slice(2))
	.then(request => request.execute())
	.catch(error => console.log(error));
```

Parsing input (`process.argv` in this example) would yield the following `Request` object in the relevant controller
and precontrollers:

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
The Command methods `addOption` and `addParameter` either take a couple of strings and booleans, or an `Option` or
`Parameter` instance respectively. Creating the instance of `Option` or `Parameter` first allows you to configure it
with more advanced behaviour.

There are different kinds of `Options` and `Parameters`; for example, `--user.name wvbe` would create an object
(`req.options.user = { name: 'wvbe' }`) if you configure it as a `DeepOption`. These extending Option and Parameter
classes are exposed on `AskNicely` and it's instances.

```
root.addOption(new root.Option('delta')
    .setShort('d')
    .setResolver(input => database.find('users', input))
    .addValidator(user => {
        if (user.username === 'wvbe')
            throw new Error('Get this sucka outta here');
    })
);
```

The resolver transforms flat text `input` into something different and is handled asynchronously if it returns a
`Promise`. The validator in the example would throw a custom error if the resolved `user` object happens to have my
username.

## Important classes
- Command
    - AskNicely (the "root" command, has added `interpret` method)
- Option
    - MultiOption (like `--emails one@hotmail.com two@hotmail.com`)
    - DeepOption (like `--config.username wvbe`)
    - IsolatedOption (like `--help`, prevents further input parsing)
- Parameter
    - DeepParameter (as seen in `git config`)

## Important methods
- Command, Option and Parameter classes
    - `constructor(name)`
    - `setDescription(description)`
- Option and Parameter classes
    - `isRequired(required)`
    - `addValidator(validator)`
    - `setResolver(resolver)`
- Parameter classes
    - `setDefault(arbitrary)`
- Option classes
    - `setDefault(arbitrary, useDefaultIfFlagMissing)`
    - `setShort(short)`
- Command classes
    - `addCommand(command|name[, controller])`
    - `setController(controller)`
    - `addParameter(parameter|name[, description, required])`
    - `addOption(option|name[, short, description, required])`
    - `addPreController(controller)`
- AskNicely class
    - `interpret([input])`
- Request class
    - `constructor()`
    - `execute([artibrary])`

## Behaviour
- Input for `Options` or `Parameters` can contain spaces if the input is wrapped in double-quotes (`--opt "My option"`)
- `Options` and `Parameters` accumulate as you go deeper from root into subcommands. In this way, any command can add
  scope to the underlying subcommands through the `Request` object
- Precontrollers (`Command#addPrecontroller()`) are accumulated as you go deeper into subcommands as well. When a
  command is ran, all of it's ancestors precontrollers are ran too. In this way, for example, a precontroller can
  determine if the execution chain should stop for a certain combination of options (by returning `false`).
- If a `MultiOption` has items in it's `default`, the parsed input can be emptied by using the option without values.
  The `default` is only used here when the option is not present at all.

## Release notes
- develop (staged for v1.1.0)
    - Adding `Command#setController(controller)`
    - Declaring properties on Request in constructor so you don't have to keep null-checking
    - Adding `MultiOption` class
- v1.0.0
    - Using ECMAScript 6
    - `Option`, `Parameter` and related classes increase configurability a thousandfold
    - Moved most parsing logic to individual classes that represent a syntax part
    - `AskNicely#interpret()` is no longer synchronous because of the ability to asynchronously resolve values
    - Ditching a lot of useless methods that are not directly used for parsing or configuring, moving a lot of other
      stuff
    - Ditching `Command#isHungry()` and `Command#isGreedy()`
- v0.1.0
    - Initial release, pretty basic parsing with limited configurability

## Issues/known bugs
- There's a problem in `VariableSyntaxPart` that would fail to clone the `default` property object of a `DeepOption` of
  `DeepParameter`, resulting in changes to the `default` value that is shared with other instances of that syntax part.
  As a work-around the `default` object is stringified and parsed again, therefore it is limited to something that can
  be serialized.
- Your terminal may replace patterns (like "*") with an actual list of matching file names before the node process is
  even started. This prevents parsing those patterns in AskNicely, and may yield unexpected results. Seen in
  `gnome-terminal` using `oh-my-zsh`. Can be circumvented by enclosing input data in double quotes, although that's
  kind of shitty.

## Wishlist
- Fix aforementioned issues and known bugs.
- A different way of stopping the controller chain, returning FALSE is a little crude
- Make it easy for commands to call other commands, maybe in a dependency-aware manner
- Test more edge cases, like conflicts and multiple values

## License
Copyright (c) 2015 Wybe Minnebo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

__THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.__

