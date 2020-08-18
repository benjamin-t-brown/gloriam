import Actor from 'game/Actor';
import { getElem } from 'db';
import Skill from 'battle/Skill';
import BattleStats from 'battle/BattleStats';
import display from 'display/Display';

class BattleActor extends Actor {
  constructor(battleController, characterTemplate, camera) {
    super(battleController, characterTemplate.spriteBase);
    this.camera = camera;
    this.stats = new BattleStats(characterTemplate);

    const { skills, name } = characterTemplate;
    this.name = name;
    this.battleX = 0;
    this.battleY = 0;
    this.selectedSkillIndex = 0;
    this.skills = skills.map(skillName => {
      return new Skill(battleController, this, getElem('skills', skillName));
    });

    this.setAnimationState('battleReady');
  }

  selectSkill(i) {
    if (i !== this.selectedSkillIndex && i >= 0 && i < this.skills.length) {
      this.selectedSkillIndex = i;
    }
  }
  getSelectedSkill() {
    return this.skills[this.selectedSkillIndex];
  }

  setTransform(transform) {
    this.transform = transform;
    this.transform.start();
    if (transform.animState) {
      this.setAnimationState(transform.animState);
    }
  }

  setBattlePosition(x, y) {
    this.battleX = x;
    this.battleY = y;
  }
  getBattlePosition() {
    return {
      x: this.battleX,
      y: this.battleY,
    };
  }
  getBattlePositionPx() {
    return {
      x: this.battleX * this.controller.getUnitLength(),
      y: this.battleY * this.controller.getPlayerFgY(),
    };
  }
  getBaseRenderPosition() {
    const { x, y } = this.getBattlePositionPx();
    const { offsetX, offsetY } = this.camera.getOffsets();
    return {
      x: x + offsetX,
      y: y + offsetY,
    };
  }

  getAdjacentPositionPx() {
    return this.getAdjacentPositionPx();
  }

  moveTo({ x, y }, ms) {
    this.moving = true;
    this.startMovingTimestamp = display.now;
    this.movingMs = ms;
    this.nextMovingX = x;
    this.nextMovingY = y;
  }

  getMinCooldownPct() {
    const lowestPct = this.skills.reduce((prev, curr) => {
      const pct = curr.getCooldownPct();
      if (prev === 0) {
        return pct;
      } else if (pct < prev) {
        return pct;
      } else {
        return prev;
      }
    }, 0);

    let pctGlobal = this.stats.getCooldownPct();

    if (lowestPct > pctGlobal) {
      return lowestPct;
    } else {
      return pctGlobal;
    }
  }

  isOnCooldown() {
    return this.getMinCooldownPct() < 100;
  }

  setRenderLocation() {
    if (this.transform) {
      this.transform.update(this.camera);
      const { x, y, scale } = this.transform.get();
      this.renderX = x;
      this.renderY = y;
      //this.scale = scale;
      if (this.transform.isDone) {
        this.transform = null;
      }
    } else {
      const { x, y } = this.getBaseRenderPosition();
      this.renderX = x;
      this.renderY = y;
    }
  }

  update() {
    this.setRenderLocation(this.camera);

    for (let i = 0; i < this.stats.statuses.length; i++) {
      const status = this.stats.statuses[i];
      status.update();
      if (status.shouldRemove) {
        if (this.stats.removeStatus(status)) {
          i--;
        }
      }
    }
  }

  draw() {
    display.drawAnimation(
      this.getCurrentAnimation(),
      this.renderX,
      this.renderY,
      {
        centered: true,
        scale: this.scale,
      }
    );
    for (let i = 0; i < this.stats.statuses.length; i++) {
      const status = this.stats.statuses[i];
      status.draw();
    }
  }
}

export default BattleActor;
