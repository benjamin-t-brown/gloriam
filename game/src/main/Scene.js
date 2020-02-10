import { getElem } from 'db';
import { Script, formatArgs } from 'db/map/ScriptParser';
import display from 'display/Display';
import { normalizeClamp, pt } from 'utils';
import input from 'display/Input';
import { getWaypointPath } from 'pathfinding';
import { HEADINGS } from 'main/Actor';

let scene = null;

class Scene {
  constructor() {
    this.storage = {};
    this.storageOnceKeys = {};

    this.room = null;
    this.battle = null;

    this.props = [];
    this.triggers = [];
    this.blockers = [];

    this.voiceEnabled = true;
    this.isWaitingForAnimation = false;
    this.isWaitingForTime = false;
    this.waitTimeoutId = 0;
    this.isWaitingForInput = false;
    this.currentTrigger = null;
    this.currentScript = null;
    this.scriptStack = [];
    this.onScriptCompleted = function() {};

    // return true to break evaluation of commands (for waiting mostly)
    const commands = (this.commands = {
      save: () => {
        this.gameInterface.save();
      },
      restore: () => {
        this.gameInterface.restore();
      },
      remove: actorName => {},
      changeRoom: roomName => {
        this.gameInterface.setRoom(roomName);
      },
      playDialogue: (actorName, subtitle, soundName) => {
        const actor = this.gameInterface.getActor(actorName);
        let ms = null;
        if (this.voiceEnabled) {
          const soundObject = display.getSound(soundName);
          if (soundObject) {
            ms = soundObject.soundDuration * 1000;
          } else {
            ms = normalizeClamp(subtitle.length, 5, 40, 750, 3000);
          }
          actor.sayDialogue(subtitle, soundName);
        } else {
          ms = normalizeClamp(subtitle.length, 5, 40, 750, 3000);
          actor.sayDialogue(subtitle);
        }
        input.setUIInputDisabled(true);
        return commands.waitMSPreemptible(ms, () => {
          actor.stopDialogue();
          input.setUIInputDisabled(false);
        });
      },
      playSound: soundName => {
        const soundObject = display.getSound(soundName);
        display.playSound(soundObject);
      },
      defaultDialogue: actorName => {},
      callScript: () => {},
      setStorage: (key, value) => {},
      setStorageOnce: (key, value) => {
        if (this.storage[key] === undefined) {
          this.storage[key] = value;
        }
      },
      walkTowards: (x, y, time) => {},
      addActor: (actorName, x, y) => {},
      addActorAtMarker: (actorName, markerName) => {},
      lookAt: (actorName, targetActorName, cb) => {
        const act = this.gameInterface.getActor(actorName);
        const act2 = this.gameInterface.getActor(targetActorName);
        this.isWaitingForAnimation = true;
        act.setPositionToTurnTowards(act2.getWalkPosition(), () => {
          if (cb) {
            cb();
          } else {
            this.isWaitingForAnimation = false;
          }
        });
        return true;
      },
      lookAtPoint: (actorName, point, cb) => {
        const act = this.gameInterface.getActor(actorName);
        this.isWaitingForAnimation = true;
        act.setPositionToTurnTowards(point, () => {
          if (cb) {
            cb();
          } else {
            this.isWaitingForAnimation = false;
          }
        });
        return true;
      },
      lookAtEachOther: (actorName, actorName2) => {
        let ctr = 0;
        this.isWaitingForAnimation = true;
        const cb = () => {
          ctr++;
          if (ctr === 2) {
            this.isWaitingForAnimation = false;
          }
        };
        commands.lookAt(actorName, actorName2, cb);
        commands.lookAt(actorName2, actorName, cb);
        return true;
      },
      lookDirection: (actorName, direction) => {
        const act = this.gameInterface.getActor(actorName);
        let point = null;
        switch (direction) {
          case HEADINGS.UP:
            point = pt(act.x, act.y - 100);
            break;
          case HEADINGS.DOWN:
            point = pt(act.x, act.y + 100);
            break;
          case HEADINGS.LEFT:
            point = pt(act.x - 100, act.y);
            break;
          case HEADINGS.RIGHT:
            point = pt(act.x + 100, act.y);
            break;
          default:
            console.warn(`[SCENE] Specified direction is not valid: '${direction}'`);
        }

        return commands.lookAtPoint(actorName, point);
      },
      setFacing: (actorName, direction) => {},
      setFacingTowards: (actorName, otherActorName) => {},
      setAnimation: (actorName, animationName) => {},
      setAnimationAndWait: (actorName, animationName) => {},
      setAnimationState: (actorName, stateName) => {
        const act = this.gameInterface.getActor(actorName);
        act.setAnimationState(stateName, stateName === 'default' ? true : false);
      },
      walkToMarker: (actorName, markerName, concurrent) => {
        const act = this.gameInterface.getActor(actorName);
        const marker = this.gameInterface.getMarker(markerName);
        if (!marker) {
          console.error('No marker exists with name', markerName);
          return;
        }
        const room = this.gameInterface.getRoom();
        const path = getWaypointPath(act.getWalkPosition(), marker, room.walls, room);
        if (path.length) {
          const cb = commands.waitUntilPreemptible();
          act.setWalkPath(path, cb);
          return true;
        }
      },
      moveFixed: (actorName, xOffset, yOffset) => {
        const act = this.gameInterface.getActor(actorName);
        act.setAt(act.x + xOffset, act.y + yOffset);
      },
      openMenu: () => {},
      walkWait: function() {},
      waitSeconds: (seconds, cb) => {
        this.isWaitingForTime = true;
        display.clearTimeout(this.waitTimeoutId);
        this.waitTimeoutId = display.setTimeout(() => {
          this.isWaitingForTime = false;
          cb();
        }, seconds * 1000);
        return true;
      },
      waitMS: (ms, cb) => {
        this.isWaitingForTime = true;
        display.clearTimeout(this.waitTimeoutId);
        this.waitTimeoutId = display.setTimeout(() => {
          this.isWaitingForTime = false;
          if (cb) {
            cb();
          }
        }, ms);
        return true;
      },
      waitMSPreemptible: (ms, cb) => {
        const mouseEvents = {
          1: () => {
            display.clearTimeout(this.waitTimeoutId);
            _cb();
          },
        };
        const keyboardEvents = {
          Enter: () => {
            display.clearTimeout(this.waitTimeoutId);
            _cb();
          },
        };
        const _cb = () => {
          this.isWaitingForTime = false;
          if (cb) {
            cb();
          }
          input.popEventListeners('mousedown', mouseEvents);
          input.popEventListeners('keydown', keyboardEvents);
        };
        this.isWaitingForTime = true;
        display.clearTimeout(this.waitTimeoutId);
        input.pushEventListeners('mousedown', mouseEvents);
        input.pushEventListeners('keydown', keyboardEvents);
        this.waitTimeoutId = display.setTimeout(_cb, ms);
        return true;
      },
      waitUntilPreemptible: () => {
        this.isWaitingForTime = true;
        return () => {
          this.isWaitingForTime = false;
        };
      },
    });
  }
  isExecutingBlockingScene() {
    return this.isWaiting();
  }

  setGameInterface(gameInterface) {
    this.gameInterface = gameInterface;
  }

  setRoom(room) {
    this.room = room;
  }

  setBattle(battle) {
    this.battle = battle;
  }

  update() {
    if (this.currentScript && !this.isWaiting()) {
      let cmd = null;
      while ((cmd = this.currentScript.getNextCommand()) !== null) {
        console.log('EVAL', cmd.conditional);
        if (this.evalCondition(cmd.conditional)) {
          console.log('next cmd', cmd.type, cmd.args);
          if (this.commands[cmd.type](...cmd.args)) {
            break;
          }
        }
      }
      if (cmd === null) {
        this.onScriptCompleted();
        if (this.scriptStack.length) {
          const { script, onScriptCompleted } = this.scriptStack.shift();
          this.currentScript = script;
          this.onScriptCompleted = onScriptCompleted;
        } else {
          this.currentScript = null;
          this.currentTrigger = null;
        }
      }
    }
  }

  evalCondition(conditional) {
    if (conditional === true) {
      return true;
    } else {
      const { type, args: originalArgs } = conditional;
      const args = formatArgs(originalArgs).map(arg => {
        if (typeof arg === 'object') {
          return arg;
        }
        console.log('FORMAT ARGS', arg, this.currentTrigger);
        const a = arg;
        if (a === 'this' && this.currentTrigger) {
          return this.storage[this.currentTrigger.name];
        } else if (typeof a === 'string' && a.indexOf('.') > -1) {
          const [a, b] = arg.split('.');
          if (a === 'storage') {
            return this.storage[b];
          }
          if (!this.storage[a]) {
            console.error('No storage in scene called:', a);
            return false;
          }
          return this.storage[a][b];
        } else {
          return arg;
        }
      });
      console.log('EVAL CONDI', type, args);
      if (type === 'is') {
        return !!args[0];
      } else if (type === 'isnot') {
        if (typeof args[0] == 'object') {
          return !this.evalCondition(args[0]);
        } else {
          return !args[0];
        }
      } else if (type === 'gt') {
        return args[0] > args[1];
      } else if (type === 'lt') {
        return args[0] < args[1];
      } else if (type === 'eq') {
        return args[0] === args[1];
      } else if (type === 'any') {
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (this.evalCondition(arg)) {
            return true;
          }
        }
        return false;
      } else if (type === 'all') {
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (!this.evalCondition(arg)) {
            return false;
          }
        }
        return true;
      } else if (type === 'as') {
        const act = this.gameInterface.getRoom().getActiveActor();
        return act.name === args[0];
      } else if (type === 'once') {
        const arg = args[0] || (this.currentScript || this.currentTrigger).name + '-once';
        if (this.storageOnceKeys[arg]) {
          console.log('NOT SET STORAGE', arg);
          return false;
        }
        console.log('SET STORAGE', arg);
        this.storageOnceKeys[arg] = true;
        return true;
      }
      return false;
    }
  }

  async callTrigger(triggerName, type) {
    const trigger = getElem('triggers', triggerName);
    if (!this.currentScript && trigger) {
      console.log('CALL TRIGGER', trigger);
      for (let i = 0; i < trigger.scriptCalls.length; i++) {
        const scriptCall = trigger.scriptCalls[i];
        this.currentTrigger = trigger;
        const c = this.evalCondition(scriptCall.condition);
        console.log('CONDITION', scriptCall.condition, scriptCall.type, c);
        if (scriptCall.type === type && c) {
          await this.callScript(scriptCall.scriptName);
          this.storage[trigger.name] = true;
          break;
        } else {
          this.currentTrigger = null;
        }
      }
    }
  }

  async callScript(scriptName) {
    return new Promise(resolve => {
      const script = getElem('scripts', scriptName);
      if (!script) {
        throw new Error(
          'Scene cannot run script.  No script exists with name "' + scriptName + '".'
        );
      }
      script.reset();
      if (this.currentScript) {
        this.scriptStack.unshift({
          script: this.currentScript,
          onScriptCompleted: this.onScriptCompleted,
        });
      }
      this.currentScript = script;
      this.onScriptCompleted = resolve;
      this.update();
    });
  }

  createAndCallScript(scriptName, commands) {
    const script = new Script(scriptName, 'internal', -1);
    const block = script.addCommandBlock();
    block.commands = commands.slice();
    script.reset();
    if (this.currentScript) {
      this.scriptStack.unshift(this.currentScript);
    }
    this.currentScript = script;
  }

  isWaiting() {
    return this.isWaitingForInput || this.isWaitingForTime || this.isWaitingForAnimation;
  }

  hasCommand(commandName) {
    return !!this.commands[commandName];
  }
}

window.scene = scene = new Scene();

export function hasCommand(commandName) {
  return !!scene.commands[commandName];
}

export default scene;
