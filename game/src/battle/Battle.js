import { getElem } from 'db';
import Stage from 'battle/Stage';
import Camera from 'main/Camera';
import BattleActor from 'battle/BattleActor';

import display from 'display/Display';

class Battle {
  constructor(setState, encounterName, playerCharacters) {
    const { stageName, enemies } = getElem('encounters', encounterName);

    this.setState = setState;
    this.cameraSpeedMs = 500;
    this.enemyTarget = null;
    this.playerAnchor = null;

    this.baseScale = 5;
    this.baseSpacing = 76;

    this.stage = new Stage(this, getElem('stages', stageName));
    this.camera = new Camera(this);
    this.cameraFg = new Camera(this);
    this.enemies = enemies.map((enemyName, i) => {
      const enemyTemplate = getElem('characters', enemyName);
      const act = new BattleActor(this, enemyTemplate, this.camera);
      act.battleX = (enemies.length - 1) / 2 - i;
      return act;
    });
    this.players = playerCharacters.map((playerCharacter, i) => {
      const act = new BattleActor(this, playerCharacter, this.cameraFg);
      act.battleX = (playerCharacters.length - 1) / 2 - i;
      act.battleY = 1;
      return act;
    });

    this.pendingSkills = [];
    this.particleSystems = [];
    this.particles = [];
    this.timers = [];

    const { x: cameraX, y: cameraY } = this.getCameraDefaultPos();
    const { x: cameraFgX, y: cameraFgY } = this.getCameraFgDefaultPos();
    this.camera.setAt(cameraX, cameraY, this.cameraSpeedMs);
    this.cameraFg.setAt(cameraFgX, cameraFgY, this.cameraSpeedMs);
    this.setBaseScale(5);
  }

  setBaseScale(s) {
    this.baseScale = s;
    this.players.concat(this.enemies).forEach(ch => {
      ch.setBaseScale(s);
    });
    this.stage.setBaseScale(s);

    const { x: cameraFgX, y: cameraFgY } = this.getCameraFgDefaultPos();
    this.cameraFg.setAt(cameraFgX, cameraFgY, this.cameraSpeedMs);
  }
  getUnitLength() {
    return this.baseScale * this.baseSpacing;
  }

  getCharacter(i, type) {
    let ret = null;
    if (type === 'enemies') {
      ret = this.enemies[i] || null;
    } else if (type === 'players') {
      ret = this.players[i] || null;
    } else if (type === undefined) {
      ret = this.enemies[i];
      if (!ret) {
        ret = this.players[i];
      }
    }
    return ret;
  }
  getCharacterIndex(ch, type) {
    let ret = null;
    if (type === 'enemies') {
      ret = this.enemies.indexOf(ch);
    } else if (type === 'players') {
      ret = this.players.indexOf(ch);
    } else if (type === undefined) {
      ret = this.enemies.indexOf(ch);
      if (ret === -1) {
        ret = this.players.indexOf(ch);
      }
    }
    return ret;
  }
  isCharacterEnemy(ch) {
    return this.enemies.indexOf(ch) > -1;
  }

  getTarget() {
    return this.enemyTarget;
  }

  targetEnemy(i) {
    if (typeof i !== 'number') {
      i = this.getCharacterIndex(i, 'enemies');
    }

    this.enemyTarget = this.getCharacter(i, 'enemies');
    const { x, y } = this.enemyTarget.getBattlePositionPx();
    this.camera.moveTo(x, y, this.cameraSpeedMs);

    const { x: playerX } = this.playerAnchor.getBattlePositionPx();
    const { y: cameraFgY } = this.getCameraFgDefaultPos();
    const cameraFgX =
      playerX -
      (playerX < 0 ? 1 : -1) * (this.getUnitLength() / 3) -
      (playerX < 0 ? 1 : -1) * this.enemyTarget.battleX * this.baseScale * 4;
    this.cameraFg.moveTo(cameraFgX, cameraFgY - this.baseScale * 4, this.cameraSpeedMs);

    this.setState({
      targetedEnemyIndex: i,
      targetedEnemy: this.enemyTarget,
    });
  }
  selectPlayerCh(i) {
    const ch = this.getCharacter(i, 'players');
    if (ch === this.playerAnchor) {
      return;
    }
    if (
      this.isCharacterUsingSkill(ch) ||
      this.isCharacterWaitingToUseSkill(ch) ||
      ch.isOnCooldown()
    ) {
      return;
    }

    this.playerAnchor = ch;
    if (this.enemyTarget === null) {
      this.targetEnemy(0);
    } else {
      this.targetEnemy(this.enemyTarget);
    }

    this.setState({
      selectedPlayerIndex: i,
      selectedPlayer: this.playerAnchor,
    });
  }
  unselectPlayerCh() {
    this.playerAnchor = null;
    const { x: cameraX, y: cameraY } = this.getCameraDefaultPos();
    const { x: cameraFgX, y: cameraFgY } = this.getCameraFgDefaultPos();
    this.camera.moveTo(cameraX, cameraY, this.cameraSpeedMs);
    this.cameraFg.moveTo(cameraFgX, cameraFgY, this.cameraSpeedMs);
    this.setState({
      selectedPlayer: null,
      selectedPlayerIndex: -1,
    });
  }
  getCameraDefaultPos() {
    return {
      x: 0,
      y: this.getUnitLength() / 3,
    };
  }
  getCameraFgDefaultPos() {
    const { height: fgHeight } = this.stage.fgAnim.getSpriteSize();
    return {
      x: 0,
      y: (fgHeight * this.stage.fgScale) / 2 - display.height / 2,
    };
  }
  getPlayerFgY() {
    const { height: fgHeight } = this.stage.fgAnim.getSpriteSize();
    return (fgHeight * this.stage.fgScale) / 2 - this.getUnitLength() / 2;
  }

  addPendingSkill(s, target) {
    this.pendingSkills.push({
      skill: s,
      started: false,
      target,
    });
    if (!this.isCharacterEnemy(s.owner)) {
      this.unselectPlayerCh();
    }
  }

  isCharacterWaitingToUseSkill(ch) {
    if (typeof ch === 'number') {
      ch = this.getCharacter(ch, 'players');
    }

    return this.pendingSkills.reduce((isWaiting, skillObj) => {
      if (isWaiting) {
        return isWaiting;
      } else {
        return skillObj.skill.owner === ch;
      }
    }, false);
  }
  isCharacterUsingSkill(ch) {
    if (typeof ch === 'number') {
      ch = this.getCharacter(ch, 'players');
    }

    const skill = this.pendingSkills[0];
    return skill !== undefined && skill.owner === ch;
  }
  addParticleSystem(ps) {
    this.particleSystems.push(ps);
  }
  addParticle(p) {
    this.particles.push(p);
  }
  addTimer(ms, cb) {
    this.timers.push({
      duration: ms,
      cb,
      startTimestamp: display.now,
    });
  }

  loop() {
    this.camera.update();
    this.cameraFg.update();
    this.stage.draw(this.camera, this.cameraFg);

    if (this.pendingSkills.length) {
      const { skill, target, started } = this.pendingSkills[0];
      if (!started) {
        skill.start(target);
        this.pendingSkills[0].started = true;
      }
      skill.update();
      if (skill.isComplete()) {
        skill.end();
        this.pendingSkills.shift();
      }
    }

    this.enemies.forEach(enemy => {
      enemy.update();
      enemy.draw();
    });
    this.players.forEach((player, i) => {
      player.update();
      player.draw();

      if (!this.playerAnchor) {
        if (
          !this.isCharacterWaitingToUseSkill(player) &&
          player.getMinCooldownPct() === 100
        ) {
          this.selectPlayerCh(i);
        }
      }
    });

    for (let i = 0; i < this.timers.length; i++) {
      const { startTimestamp, duration, cb } = this.timers[i];
      if (display.now - startTimestamp > duration) {
        cb();
        this.timers.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.update();
      p.draw();
      if (p.shouldRemove) {
        this.particles.splice(i, 1);
        i--;
      }
    }
  }
}

export default Battle;
