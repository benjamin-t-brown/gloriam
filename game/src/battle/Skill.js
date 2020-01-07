import display from 'display/Display';
import { normalizeClamp } from 'utils';

class Skill {
  constructor(battleController, battleActor, skillTemplate) {
    const { events, cooldownDurationMs, skillType, name } = skillTemplate;
    this.name = name;
    this.battleController = battleController;
    this.owner = battleActor;
    this.cooldownDurationMs = cooldownDurationMs;
    this.skillType = skillType;
    this.timestampStart = 0;
    this.currentEventIndex = 0;
    this.currentTarget = null;
    this.totalDurationMs = 0;
    this.events = events.map(event => {
      const ret = { ...event };
      if (ret.duration === 'anim') {
        const anim = display.getAnimation(battleActor.spriteBase, event.animState);
        ret.duration = anim.getDurationMs();
        ret.duration += event.durationPadding;
      }
      ret.timestampBegin = this.totalDurationMs;
      ret.timestampEnd = ret.timestampBegin + ret.duration;
      this.totalDurationMs += ret.duration;
      return ret;
    });
    this.timestampEnd = this.timestampStart + battleActor.stats.getCooldownDuration(this);
  }

  start(target) {
    this.timestampStart = display.now;
    this.timestampEnd = this.timestampStart + this.owner.stats.getCooldownDuration(this);
    this.currentEventIndex = 0;
    this.currentTarget = target;
    this.owner.stats.setIsOnCooldown();
  }

  end() {}

  isStarted() {
    return this.started;
  }

  isOnCooldown() {
    return this.getCooldownPct() < 100;
  }

  getCooldownPct() {
    return normalizeClamp(
      display.now,
      this.timestampEnd,
      this.timestampEnd + this.totalDurationMs,
      0,
      100
    );
  }

  isComplete() {
    return display.now - this.timestampStart > this.totalDurationMs;
  }

  getEventIndex(timestampNow) {
    let lastIndex = 0;
    let leftI = this.currentEventIndex;
    let rightI = this.events.length - 1;
    while (leftI <= rightI) {
      const midI = leftI + Math.floor((rightI - leftI) / 2);
      lastIndex = midI;
      const { timestampEnd, timestampBegin } = this.events[midI];

      const beginTime = timestampBegin + this.timestampStart;
      const endTime = timestampEnd + this.timestampStart;

      if (timestampNow < endTime && timestampNow > beginTime) {
        return midI;
      }

      if (timestampNow >= endTime) {
        leftI = midI + 1;
      } else {
        rightI = midI - 1;
      }
    }
    return lastIndex;
  }

  update() {
    const eventIndex = this.getEventIndex(display.now);
    for (let i = this.currentEventIndex; i < eventIndex; i++) {
      const { cb, animState } = this.events[eventIndex];
      if (eventIndex !== this.currentEventIndex) {
        if (cb) {
          cb(this.battleController, this.owner, this.currentTarget);
        }
        if (animState) {
          this.owner.setAnimationState(animState);
        }
      }
    }
    this.currentEventIndex = eventIndex;
  }
}

export default Skill;
