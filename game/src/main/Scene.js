import { getElem } from 'db';
import { Script, formatArgs } from 'db/map/ScriptParser';
import display from 'display/Display';
import { normalizeClamp, pt } from 'utils';
import input from 'display/Input';
import { getWaypointPath } from 'pathfinding';
import { HEADINGS } from 'main/Actor';

let scene = null;

export const MODES = {
  ROOM: 'Room',
  BATTLE: 'Battle',
  NARRATIVE: 'Narrative',
};

class Scene {
  constructor() {
    this.storage = {
      activeItem: '',
      Rydo: {
        items: {},
      },
      Ferelith: {
        items: {},
      },
    };
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

    const setMode = mode => {
      this.gameInterface.setMode(mode);
    };
    const save = () => {
      this.gameInterface.save();
    };
    const restore = () => {
      this.gameInterface.restore();
    };
    const remove = actorName => {
      const commands = this.getCommands();
      commands.removeActor(actorName);
    };
    const removeActor = actorName => {
      const act = this.gameInterface.getActor(actorName);
      if (act) {
        act.remove();
      } else {
        console.error('Cannot get actor to remove', actorName);
      }
    };
    const changeRoom = (roomName, nextMarkerName, direction) => {
      this.gameInterface.setRoom(roomName);
      if (nextMarkerName && direction) {
        const player = this.gameInterface.getPlayer();
        const marker = this.gameInterface.getMarker(nextMarkerName);
        if (!marker) {
          console.error('Could not get marker named', nextMarkerName);
        }
        player.setAtWalkPosition(pt(marker.x, marker.y));
        player.setHeading(direction);
      }
    };
    const playDialogue = (actorName, subtitle, soundName) => {
      console.log('play dialog', actorName, subtitle, soundName);
      const commands = this.getCommands();
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
    };
    const playDialogueInterruptable = (actorName, subtitle, soundName) => {
      const commands = this.getCommands();
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
      commands.waitMSPreemptible(ms, () => {
        actor.stopDialogue();
      });
    };
    const playSound = soundName => {
      const soundObject = display.getSound(soundName);
      if (soundObject) {
        display.playSound(soundObject);
      }
    };
    const defaultDialogue = actorName => {};
    const callScript = scriptName => {
      scene.callScript(scriptName);
      return true;
    };
    const setStorage = (key, value) => {};
    const setStorageOnce = (key, value) => {
      if (this.storage[key] === undefined) {
        this.storage[key] = value;
      }
    };
    const walkTowards = (x, y, time) => {};
    const addActor = (actorName, x, y) => {};
    const addActorAtMarker = (actorName, markerName) => {};
    const lookAt = (actorName, targetActorName, cb) => {
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
    };
    const lookAtPoint = (actorName, point, cb) => {
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
    };
    const lookAtEachOther = (actorName, actorName2) => {
      const commands = this.getCommands();
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
    };
    const lookDirection = (actorName, direction) => {
      const commands = this.getCommands();
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
    };
    const setFacing = (actorName, direction) => {};
    const setFacingTowards = (actorName, otherActorName) => {};
    const setAnimation = (actorName, animationName) => {
      const act = this.gameInterface.getActor(actorName);
      act.setAnimation(animationName);
    };
    const setAnimationAndWait = (actorName, animationName) => {
      const commands = this.getCommands();
      const act = this.gameInterface.getActor(actorName);
      const animation = display.getAnimation(animationName);
      act.setAnimation(animationName);
      commands.waitMS(animation.getDurationMs());
      return true;
    };
    const setAnimationState = (actorName, stateName) => {
      const act = this.gameInterface.getActor(actorName);
      act.setAnimationState(stateName, stateName === 'default' ? true : false);
    };
    const setAnimationStateAndWait = (actorName, stateName) => {
      const commands = this.getCommands();
      const act = this.gameInterface.getActor(actorName);
      const animation = act.setAnimationState(
        stateName,
        stateName === 'default' ? true : false
      );
      commands.waitMS(animation.getDurationMs());
      return true;
    };
    const walkToMarker = (actorName, markerName, concurrent) => {
      const commands = this.getCommands();
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
    };
    const walkToActor = (actorName, actorName2, concurrent) => {
      const commands = this.getCommands();
      const act = this.gameInterface.getActor(actorName);
      const otherActor = this.gameInterface.getActor(actorName2);
      if (!otherActor) {
        console.error('No other actor exists with name', actorName2);
        return;
      }
      const room = this.gameInterface.getRoom();
      const path = getWaypointPath(act.getWalkPosition(), otherActor, room.walls, room);
      if (path.length) {
        const cb = commands.waitUntilPreemptible();
        act.setWalkPath(path, cb);
        return true;
      }
    };
    const moveFixed = (actorName, xOffset, yOffset) => {
      const act = this.gameInterface.getActor(actorName);
      act.setAt(act.x + xOffset, act.y + yOffset);
    };
    const acquireItem = (actorName, itemName) => {
      const actStorage = this.storage[actorName];
      if (!actStorage) {
        console.error(
          'Cannot acquireItem, no actor storage exists with actorName:',
          actorName
        );
        return;
      }
      actStorage[itemName] = actStorage[itemName] ? actStorage[itemName] + 1 : 1;
    };
    const removeItem = (actorName, itemName) => {
      const actStorage = this.storage[actorName];
      if (!actStorage) {
        console.error(
          'Cannot removeItem, no actor storage exists with actorName:',
          actorName
        );
        return;
      }
      actStorage[itemName] = actStorage[itemName] ? actStorage[itemName] - 1 : 0;
    };
    const dropItem = (actorName, itemName) => {
      const actStorage = this.storage[actorName];
      if (!actStorage) {
        console.error(
          'Cannot dropItem, no actor storage exists with actorName:',
          actorName
        );
        return;
      }
      actStorage[itemName] = actStorage[itemName] ? actStorage[itemName] - 1 : 0;
    };
    const openMenu = () => {};
    const shakeScreen = () => {};
    const walkWait = function() {};
    const waitSeconds = (seconds, cb) => {
      this.isWaitingForTime = true;
      display.clearTimeout(this.waitTimeoutId);
      this.waitTimeoutId = display.setTimeout(() => {
        this.isWaitingForTime = false;
        cb();
      }, seconds * 1000);
      return true;
    };
    const waitMS = (ms, cb) => {
      this.isWaitingForTime = true;
      display.clearTimeout(this.waitTimeoutId);
      this.waitTimeoutId = display.setTimeout(() => {
        this.isWaitingForTime = false;
        if (cb) {
          cb();
        }
      }, ms);
      return true;
    };
    const waitMSPreemptible = (ms, cb) => {
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
    };
    const waitUntilPreemptible = () => {
      this.isWaitingForTime = true;
      return () => {
        this.isWaitingForTime = false;
      };
    };
    const waitForUserInput = cb => {
      this.isWaitingForInput = true;
      return () => {
        this.isWaitingForInput = false;
        if (cb) {
          cb();
        }
      };
    };

    const playDialogNarrative = (actorName, subtitle, soundName) => {
      this.gameInterface.setNarrativeText(actorName, subtitle);
      return waitForUserInput();
    };

    const setNarrativeBackground = imageName => {
      // const narrative = this.gameInterface.
      this.gameInterface.setNarrativeBackground(imageName);
    };

    const setNarrativeTextLocation = (locX, locY) => {
      const style = {};
      if (locX === 'right') {
        style.right = 0;
        style.width = '40%';
      } else if (locX === 'center') {
        style.right = 0;
        style.left = 0;
      } else {
        style.left = 0;
        style.width = '40%';
      }

      if (locY === 'top') {
        style.top = 0;
      } else if (locY === 'bottom') {
        style.bottom = 0;
      }

      this.gameInterface.setNarrativeTextPosition(style);
    };

    this.defaultCommands = {
      setMode,
      setStorage,
      setStorageOnce,
      callScript,
      playSound,
      shakeScreen,
      save,
      restore,
      waitSeconds,
      waitMS,
      waitMSPreemptible,
      waitUntilPreemptible,
    };

    this.roomCommands = {
      ...this.defaultCommands,
      remove,
      removeActor,
      changeRoom,
      playDialogue,
      playDialogueInterruptable,
      defaultDialogue,
      walkTowards,
      addActor,
      addActorAtMarker,
      lookAt,
      lookAtPoint,
      lookAtEachOther,
      lookDirection,
      setFacing,
      setFacingTowards,
      setAnimation,
      setAnimationAndWait,
      setAnimationState,
      setAnimationStateAndWait,
      walkToMarker,
      walkToActor,
      moveFixed,
      acquireItem,
      removeItem,
      dropItem,
      openMenu,
      walkWait,
    };

    this.narrativeCommands = {
      ...this.defaultCommands,
      setNarrativeBackground,
      setNarrativeTextLocation,
      playDialogue: playDialogNarrative,
    };

    this.allCommands = {
      ...this.roomCommands,
      ...this.narrativeCommands,
    };
  }
  getCommands(all) {
    if (all) {
      return this.allCommands;
    }

    const mode = this.gameInterface.getMode();

    if (mode === MODES.ROOM) {
      return this.roomCommands;
    } else if (mode === MODES.NARRATIVE) {
      return this.narrativeCommands;
    }

    return this.allCommands;
  }

  stopWaitingForInput() {
    this.isWaitingForInput = false;
    this.update();
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
          const commands = this.getCommands();
          console.log('next cmd', cmd.type, cmd.args);
          const command = commands[cmd.type];
          if (!command) {
            throw new Error(
              `Script runtime error.  No command exists with name '${
                cmd.type
              }' as mode '${this.gameInterface.getMode()}'`
            );
          }
          console.log('call command', cmd.type, command);
          if (command(...cmd.args)) {
            break;
          }
        }
      }
      if (cmd === null) {
        console.log(
          `Completed Script '${this.currentScript.name}' stackLength='${this.scriptStack.length}'`
        );
        this.onScriptCompleted();
        if (this.scriptStack.length) {
          const { script, onScriptCompleted } = this.scriptStack.shift();
          this.currentScript = script;
          this.onScriptCompleted = onScriptCompleted;
          setTimeout(() => this.update());
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
          return false;
        }
        this.storageOnceKeys[arg] = true;
        return true;
      } else if (type === 'with') {
        const arg = args[0];
        return arg === this.storage.activeItem;
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
    const commands = this.getCommands(true);
    return !!commands[commandName];
  }
}

window.scene = scene = new Scene();

export function hasCommand(commandName) {
  const commands = scene.getCommands(true);
  return !!commands[commandName];
}

export default scene;
