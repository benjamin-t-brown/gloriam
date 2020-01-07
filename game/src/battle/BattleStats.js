import { normalizeEaseOut, normalize, normalizeClamp } from 'utils';
import display from 'display/Display';

class BattleStats {
  constructor(characterTemplate) {
    const {
      POW,
      ACC,
      FOR,
      CON,
      RES,
      SPD,
      EVA,
      baseHp,
      hp,
      baseShieldHp,
      shieldHp,
    } = characterTemplate;

    this.baseHp = baseHp || 0;
    this.baseShieldHp = baseShieldHp || 0;
    this.baseCooldownDurationMs = 8000;
    this.statuses = [];

    this.POW = POW;
    this.ACC = ACC;
    this.FOR = FOR;
    this.CON = CON;
    this.RES = RES;
    this.SPD = SPD;
    this.EVA = EVA;

    this.hp = hp || this.getMaxHp();
    this.shield = shieldHp || this.getMaxShield();
    this.cooldownStartTimestamp = 0;
    this.cooldownDurationMs = 0;
  }

  getStatusIndex(statusName) {
    console.log('GET STATUS NAME', statusName);
    return this.statuses.reduce((statusIndex, status, i) => {
      console.log('CHECK', statusName, status.name);
      if (statusIndex > -1) {
        return statusIndex;
      }
      return status.name === statusName ? i : -1;
    }, -1);
  }

  addStatus(s) {
    const i = this.getStatusIndex(s.name);
    if (i > -1) {
      this.removeStatus(this.statuses[i]);
      console.log('CHANGED STATUS');
    }

    this.statuses.push(s);
    s.start();
  }

  removeStatus(s) {
    const i = this.statuses.indexOf(s);
    if (i > -1) {
      console.log('REMOVE STATUS', s);
      this.statuses.splice(i, 1);
      s.onRemoved(s);
      return true;
    }
    return false;
  }

  modifyHp(n) {
    this.hp += n;
    let leftover = 0;
    if (this.hp > this.getMaxHp()) {
      leftover = this.hp - this.getMaxHp();
      this.hp = this.getMaxHp();
    } else if (this.hp < 0) {
      leftover = -this.hp;
      this.hp = 0;
    }
    return leftover;
  }

  modifyShield(n) {
    this.shield += n;
    let leftover = 0;
    if (this.shield > this.getMaxHp()) {
      leftover = this.shield - this.getMaxShield();
      this.shield = this.getMaxHp();
    } else if (this.shield < 0) {
      leftover = -this.shield;
      this.shield = 0;
    }
    return leftover;
  }

  modifyEffectiveHp(n) {
    const diff = this.modifyHp(n);
    this.modifyShield(diff);
  }

  setIsOnCooldown() {
    this.cooldownDurationMs = this.baseCooldownDurationMs;
    this.cooldownStartTimestamp = display.now;
  }

  getCooldownPct() {
    return normalizeClamp(
      display.now,
      this.cooldownStartTimestamp,
      this.cooldownStartTimestamp + this.cooldownDurationMs,
      0,
      100
    );
  }

  getMaxHp() {
    const { CON, FOR } = this;
    const r1 = Math.round(normalizeEaseOut(CON, 0, 99, 10, 6000));
    const r2 = Math.round(normalize(FOR, 0, 99, 10, 2000));
    return this.baseHp + r1 + r2;
  }

  getMaxShield() {
    const { RES, FOR } = this;
    const r1 = Math.round(normalizeEaseOut(RES, 0, 99, 0, 3000));
    const r2 = Math.round(normalize(FOR, 0, 99, 0, 1000));
    return this.baseShieldHp + r1 + r2;
  }

  getCurrentHp() {
    if (this.hp < 0) {
      return 0;
    }

    return this.hp;
  }

  getCurrentShield() {
    if (this.shield < 0) {
      return 0;
    }

    return this.shield;
  }

  getDamage() {
    const { POW } = this;
    const r = Math.round(normalizeEaseOut(POW, 0, 99, 0, 9999));
    return 1 + r;
  }

  getAvoidancePct() {
    const { EVA } = this;
    return (EVA / 4) * 100;
  }

  getHpDamageReductionPct() {
    const { CON, FOR } = this;
    const r1 = normalize(CON, 0, 99, 0, 10);
    const r2 = normalizeEaseOut(FOR, 0, 99, 0, 20);
    return r1 + r2;
  }

  getShieldDamageReductionPct() {
    const { FOR, RES } = this;
    const r1 = normalize(FOR, 0, 99, 0, 5);
    const r2 = normalizeEaseOut(RES, 0, 99, 0, 25);
    return r1 + r2;
  }

  getCritPct() {
    const { ACC } = this;
    return (ACC / 2) * 100;
  }

  getCooldownDuration(skill) {
    const { SPD } = this;
    return (
      this.baseCooldownDurationMs * (100 - SPD / 3) +
      skill.cooldownDurationMs * (100 - SPD / 2)
    );
  }

  isDead() {
    return this.hp <= 0;
  }
}

export default BattleStats;
