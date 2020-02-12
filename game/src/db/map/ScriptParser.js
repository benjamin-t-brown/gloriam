export function splitNotInParens(str, spl) {
  const ret = [];
  let agg = '';
  let quote = '';
  let ignore = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (quote) {
      if (ch === quote) {
        quote = '';
        ignore = false;
      }
    } else if (ch === `"` || ch === `'`) {
      quote = ch;
      ignore = true;
    } else if (ch === '(') {
      ignore = true;
    } else if (ch === ')') {
      ignore = false;
    }

    if (!ignore && str[i] === spl) {
      ret.push(agg);
      agg = '';
    } else {
      agg += ch;
    }
  }
  if (agg) {
    ret.push(agg);
  }
  return ret;
}

export function indexOfNotInParens(str, spl) {
  let quote = '';
  let ignore = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (quote) {
      if (ch === quote) {
        quote = '';
        ignore = false;
      }
    } else if (ch === `"` || ch === `'`) {
      quote = ch;
      ignore = true;
    } else if (ch === '(') {
      ignore = true;
    } else if (ch === ')') {
      ignore = false;
    }

    if (!ignore && str[i] === spl) {
      return i;
    }
  }
  return -1;
}

export function removeQuotes(args) {
  return args.map(arg => {
    if (arg[0] === '"' || arg[0] === "'") {
      return arg.slice(1, -1);
    } else {
      return arg;
    }
  });
}

export function formatArgs(args) {
  return removeQuotes(args).map(arg => {
    if (!isNaN(parseFloat(arg))) {
      return parseFloat(arg);
    } else {
      return arg;
    }
  });
}

export class Trigger {
  constructor(name, filename, lineNum) {
    this.name = name;
    this.filename = filename;
    this.lineNum = lineNum;
    this.scriptCalls = [];
  }

  addScriptCall(triggerType, condition, scriptName) {
    this.scriptCalls.push({
      type: triggerType,
      condition: condition,
      scriptName: scriptName,
    });
  }
}

export class Script {
  constructor(name, filename, lineNum) {
    this.name = name;
    this.filename = filename;
    this.lineNum = lineNum;
    this.blocks = [];

    this.soundNameStorage = {};

    this.currentBlockIndex = 0;
    this.currentCommandIndex = 0;
    this.sounds = 0;
    this.soundsPerCharacter = {};
  }

  reset() {
    this.currentBlockIndex = 0;
    this.currentCommandIndex = 0;
  }

  isValid(scene) {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      for (let j = 0; j < block.commands.length; j++) {
        const command = block.commands[j];
        if (!scene.hasCommand(command.type, command.args)) {
          return (
            `Error in script "${this.name}"\n\n` +
            `No command exists with name "${command.type}" ` +
            `and args "${command.args.join(',')}" `
          );
        }
      }
    }
    return true;
  }

  getNextCommand() {
    const block = this.blocks[this.currentBlockIndex];
    if (block) {
      const cmd = block.commands[this.currentCommandIndex];
      if (cmd) {
        this.currentCommandIndex++;
        const ret = {
          args: cmd.args,
          type: cmd.type,
          conditional: block.conditional,
        };
        return ret;
      } else {
        this.currentBlockIndex++;
        this.currentCommandIndex = 0;
        return this.getNextCommand();
      }
    } else {
      return null;
    }
  }

  getNextDialog(actorName) {
    if (this.soundsPerCharacter[actorName]) {
      this.soundsPerCharacter[actorName]++;
    } else {
      this.soundsPerCharacter[actorName] = 1;
    }
    let n = this.soundsPerCharacter[actorName];
    if (n < 10) {
      n = '0' + n;
    }
    const soundNameIndexed = this.name + '/' + this.sounds;
    const soundNameCh = this.name + '/' + actorName + '-' + n;

    this.sounds++;
    return { soundNameIndexed, soundNameCh };
  }

  print() {
    console.log('SCRIPT', this.name, this.blocks);
  }

  addCommandBlock() {
    const block = {
      conditional: true,
      commands: [],
    };
    this.blocks.push(block);
    return block;
  }
}

export class ScriptParser {
  constructor(name) {
    this.name = name;
    this.soundsToLoad = [];
  }

  throwParsingError(err, lineNum, lineContents) {
    console.error(
      `{Line ${lineNum}} Script parsing error ${this.name}: ${err} CONTENTS [\n"${lineContents}"\n]`
    );
    throw new Error('Parsing error');
  }

  parseCommand(commandSrc, lineNum, script) {
    commandSrc = commandSrc.trim();
    const firstParenIndex = commandSrc.indexOf('(');
    const lastParenIndex = commandSrc.lastIndexOf(')');

    if (commandSrc.match(/^(\w)+:/)) {
      return this.createDialogCommand(commandSrc, script);
    }

    if (firstParenIndex === -1 || firstParenIndex === 0) {
      this.throwParsingError('Invalid command, no name provided', lineNum, commandSrc);
    }
    if (lastParenIndex === -1 || lastParenIndex === 0) {
      this.throwParsingError('Invalid command, no end parens', lineNum, commandSrc);
    }

    let args = commandSrc.substr(
      firstParenIndex + 1,
      commandSrc.length - (firstParenIndex + 1) - (commandSrc.length - lastParenIndex)
    );
    args = splitNotInParens(args, ',').map(arg => arg.trim());
    args.forEach(arg => {
      if (arg[0] === "'") {
        if (arg[arg.length - 1] !== "'") {
          this.throwParsingError(
            'Invalid command, unterminated single quote "\'"',
            lineNum,
            commandSrc
          );
        }
      } else if (arg[0] === '"') {
        if (arg[arg.length - 1] !== '"') {
          this.throwParsingError(
            "Invalid command, unterminated double quote '\"'",
            lineNum,
            commandSrc
          );
        }
      }
    });

    return {
      type: commandSrc.substr(0, firstParenIndex),
      args: formatArgs(args),
    };
  }

  parseConditional(conditionalSrc, lineNum, script) {
    const { type, args } = this.parseCommand(conditionalSrc, lineNum, script);
    const validTypes = ['is', 'isnot', 'gt', 'lt', 'eq', 'any', 'all', 'as', 'once'];
    if (!validTypes.includes(type)) {
      this.throwParsingError(
        `Invalid conditional, no type named "${type}"`,
        lineNum,
        conditionalSrc
      );
    }

    return {
      type: type,
      args: args.map(arg => {
        if (typeof arg === 'string' && arg.indexOf('(') !== -1) {
          return this.parseCommand(arg, lineNum, script);
        } else {
          return arg;
        }
      }),
    };
  }

  getConditionalFromLine(line, lineNum, script) {
    const conditionalStartIndex = indexOfNotInParens(line, '?');
    if (conditionalStartIndex > -1) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        this.throwParsingError(`Invalid conditional, no ending ':'`, lineNum, line);
      }
      const conditionalSrc = line.slice(conditionalStartIndex + 1, colonIndex);
      const conditional = this.parseConditional(conditionalSrc.trim(), lineNum, script);
      return { conditional, endIndex: colonIndex + 1 };
    } else {
      return { conditional: true, endIndex: 0 };
    }
  }

  createDialogCommand(line, script) {
    let [actorName, subtitle] = line.split(':');
    subtitle = subtitle.trim();
    const { soundNameCh, soundNameIndexed } = script.getNextDialog(actorName);
    this.soundsToLoad.push({ soundNameCh, soundNameIndexed });
    return {
      type: 'playDialogue',
      args: formatArgs([actorName, subtitle, soundNameCh]),
    };
  }

  parse(src, scene) {
    const triggers = {};
    const scripts = {};

    const addTrigger = (n, s) => (triggers[n] = s);
    const addScript = (n, s) => (scripts[n] = s);

    let isCodeBlock = false;
    let isTrigger = false;
    let isChoice = false;
    let currentBlock = null;
    let currentScript = null;
    let currentTrigger = null;
    let currentTriggerName = null;
    const lines = src.split('\n');

    lines.forEach((line, lineNum) => {
      lineNum = lineNum + 1;
      line = line.trim();
      if (line.length === 0) {
        return;
      }
      if (line[0] === '/' && line[1] === '/') {
        return;
      }

      const firstCh = line[0];
      if (firstCh === '{') {
        isCodeBlock = true;
      } else if (firstCh === '}') {
        isCodeBlock = false;
        currentBlock = null;
      } else if (firstCh === '@' && !isCodeBlock) {
        let scriptName = line.substr(1, line.length - 1);
        if (scriptName === 'this') {
          scriptName = currentTriggerName;
        }
        if (scriptName.length === 0) {
          this.throwParsingError('Invalid script name', lineNum, line);
        }
        if (currentScript) {
          const err = currentScript.isValid(scene);
          if (err !== true) {
            this.throwParsingError(err, lineNum - 1, '');
          }
        }
        currentScript = new Script(scriptName, this.name, lineNum);
        addScript(scriptName, currentScript);
        isTrigger = false;
        isChoice = false;
      } else if (firstCh === '$') {
        isChoice = true;
        isTrigger = false;
        currentBlock = currentScript.addCommandBlock();
        currentBlock.conditional = true;
        currentBlock.commands.push({
          type: 'showChoices',
          args: [],
        });
      } else if (firstCh === '#') {
        isTrigger = true;
        isChoice = false;
        currentTriggerName = line.substr(1);
        currentTrigger = new Trigger(line.substr(1), this.name, lineNum);
        addTrigger(line.substr(1), currentTrigger);
      } else if (firstCh === '+' || isCodeBlock) {
        let commandContents = line.substr(isCodeBlock ? 0 : 1);
        const { conditional, endIndex } = this.getConditionalFromLine(
          commandContents,
          lineNum,
          currentScript
        );
        if (typeof conditional === 'object') {
          if (commandContents[endIndex] === '{') {
            isCodeBlock = true;
            currentBlock = currentScript.addCommandBlock();
            currentBlock.conditional = conditional;
            return;
          } else if (endIndex === commandContents.length) {
            currentBlock = currentScript.addCommandBlock();
            currentBlock.conditional = conditional;
            return;
          }
        }
        let commandSrc = commandContents.substr(endIndex);
        if (commandSrc[0] === '+') {
          commandSrc = commandSrc.slice(1);
        }

        const { type, args } = this.parseCommand(commandSrc, lineNum, currentScript);
        let block = null;
        if (isCodeBlock) {
          if (currentBlock === null) {
            currentBlock = currentScript.addCommandBlock();
            currentBlock.conditional = conditional;
          }
          block = currentBlock;
        } else {
          block = currentBlock = currentScript.addCommandBlock();
          block.conditional = conditional;
        }
        const command = {
          type,
          args,
        };
        block.commands.push(command);
      } else if (isChoice) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          this.throwParsingError(
            `Invalid choice definition, no colon '"'`,
            lineNum,
            line
          );
        }
        const choiceText = line.substr(0, colonIndex);
        const target = line.substr(colonIndex + 1);
        currentBlock.commands[0].args.push({
          text: choiceText,
          target: target,
        });
      } else if (isTrigger) {
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) {
          this.throwParsingError(
            `Invalid trigger script call, invalid number of arguments`,
            lineNum,
            line
          );
        }
        const triggerType = line.substr(0, firstCommaIndex);
        const triggerContents = line.substr(firstCommaIndex + 1);
        const { conditional, endIndex } = this.getConditionalFromLine(
          triggerContents,
          lineNum
        );
        let scriptName = triggerContents.substr(endIndex);
        if (scriptName === 'this') {
          scriptName = currentTriggerName;
        }
        currentTrigger.addScriptCall(triggerType, conditional, scriptName);
      } else if (firstCh === '>') {
        currentBlock.commands.push({
          type: 'callScript',
          args: line.substr(1),
        });
      } else {
        isTrigger = false;
        const block = currentScript.addCommandBlock();
        const command = this.createDialogCommand(line, currentScript);
        block.commands.push(command);
      }
    });
    if (currentScript) {
      const err = currentScript.isValid(scene);
      if (err !== true) {
        this.throwParsingError(err, lines.length, lines[lines.length - 1]);
      }
    }
    return { triggers, scripts };
  }
}

export default ScriptParser;
