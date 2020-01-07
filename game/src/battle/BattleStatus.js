import display from 'display/Display';
import Transform from 'battle/Transform';

class BattleStatus {
  constructor({ battleController, statusTemplate, victim, activator }) {
    this.battleController = battleController;
    this.victim = victim;
    this.activator = activator;

    const {
      name,
      statusType,
      durationMs,
      onInterval,
      particleAnimName,
      intervalDurationMs,
      onDamage,
      onSkillUsed,
      onApplied,
      onRemoved,
      onComplete,
      statModifications,
    } = statusTemplate;

    this.name = name;
    this.shouldRemove = false;
    this.startTimestamp = 0;
    this.particleAnim = particleAnimName ? display.getAnimation(particleAnimName) : null;
    this.statusType = statusType || 'negative';
    this.durationMs = durationMs || Infinity;
    this.intervalDurationMs = intervalDurationMs || 1000;
    this.onInterval = onInterval || function() {};
    this.onDamage = onDamage || function() {};
    this.onSkillUsed = onSkillUsed || function() {};
    this.onApplied = onApplied || function() {};
    this.onRemoved = onRemoved || function() {};
    this.onComplete = onComplete || function() {};
    this.statModifications = statModifications || {};

    this.transform = new Transform(1000);
    this.transform.setSticky();
    this.transform.setAtTarget(this.victim);
  }

  getStatModification(statName) {
    const mod = this.statModifications[statName];
    return mod || 0;
  }

  start() {
    this.startTimestamp = display.now;
    this.onApplied(this);
  }

  update() {
    if (display.now - this.startTimestamp > this.intervalDurationMs) {
      this.startTimestamp = this.startTimestamp + this.intervalDurationMs;
      this.onInterval(this);
    }
    if (display.now - this.startTimestamp > this.durationMs) {
      this.shouldRemove = true;
    }
  }

  draw() {
    if (this.particleAnim) {
      display.drawAnim(this.particleAnim, this.victim.renderX, this.victim.renderY, {
        scale: this.battleController.baseScale,
        centered: true,
      });
    }
  }
}

export default BattleStatus;
