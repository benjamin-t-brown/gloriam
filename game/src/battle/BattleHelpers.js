import Transform from 'battle/Transform';
import BattleParticle from 'battle/BattleParticle';
import { normalizeClamp, normalizeEaseOutClamp } from 'utils';
import display from 'display/Display';
import { getElem } from 'db';
import BattleStatus from 'battle/battleStatus';

export const constants = {
  JUMP_MS: 500,
  DAMAGED_MS: 800,
  DAMAGED_TEXT_MS: 750,
  STATUS_TEXT_MS: 850,
  PROJECTILE_MS: 500,
};

function getColorFromDamageType(damageType) {
  if (damageType === 'shield') {
    return '#92F4FF';
  } else if (damageType === 'health') {
    return '#FF8B9C';
  } else {
    return '#F8F8F8';
  }
}

export function setAtAttackingPosition(battle, ch, target, ms) {
  const t = new Transform(ms);
  const negator = target.battleY === 0 ? 1 : -1;
  t.setTarget({
    getBaseRenderPosition: () => {
      const { x, y } = target.getBaseRenderPosition();
      return {
        x,
        y: y + (negator * battle.getUnitLength()) / 5,
      };
    },
  });
  ch.setTransform(t);
}
export function jumpToAttackingPosition(battle, ch, target) {
  const t = new Transform(constants.JUMP_MS);
  t.setSticky();
  const negator = target.battleY === 0 ? 1 : -1;

  t.setAnchorAndTarget(ch, {
    getBaseRenderPosition: () => {
      const { x, y } = target.getBaseRenderPosition();
      return {
        x,
        y: y + (negator * battle.getUnitLength()) / 5,
      };
    },
  });
  t.setAnimationState('battleJump');
  t.setNormalizeFunc('y', (x, a, b, c, d) => {
    const r = normalizeClamp(x, a, b, 0, Math.PI);
    const y = normalizeClamp(x, a, b, c, d);
    return y + (-battle.getUnitLength() * Math.sin(r)) / 2;
  });

  ch.setTransform(t);
}
export function jumpForward(battle, ch) {
  const t = new Transform(constants.JUMP_MS);
  if (ch.battleY === 0) {
    //isEnemy
    t.setAnchorAndTarget(ch, {
      getBaseRenderPosition: () => {
        const { x, y } = ch.getBaseRenderPosition();
        return {
          x,
          y: y + battle.getUnitLength() / 10,
        };
      },
    });
  } else {
    //isPlayer
    t.setAnchorAndTarget(ch, {
      getBaseRenderPosition: () => {
        const { x, y } = ch.getBaseRenderPosition();
        return {
          x,
          y: y - battle.getUnitLength() / 10,
        };
      },
    });
  }
  t.setSticky();
  t.setAnimationState('battleJump');
  ch.setTransform(t);
}
export function jumpToDefaultPosition(battle, ch, target) {
  const t = new Transform(constants.JUMP_MS);
  const negator = target.battleY === 0 ? 1 : -1;

  t.setAnchorAndTarget(
    {
      getBaseRenderPosition: () => {
        const { x, y } = target.getBaseRenderPosition();
        return {
          x,
          y: y + (negator * battle.getUnitLength()) / 5,
        };
      },
    },
    ch
  );
  t.setAnimationState('battleJump');
  t.setNormalizeFunc('y', (x, a, b, c, d) => {
    const r = normalizeClamp(x, a, b, 0, Math.PI);
    const y = normalizeClamp(x, a, b, c, d);
    return y + (-battle.getUnitLength() * Math.sin(r)) / 2;
  });

  ch.setTransform(t);
}

export function createProjectile(battle, ch, target, { animName, explAnimName, ms, cb }) {
  const t = new Transform(ms || constants.PROJECTILE_MS);
  t.setAnchorAndTarget(ch, target);
  t.setAnimationState(animName);
  t.setNormalizeFunc('y', (x, a, b, c, d) => {
    const r = normalizeClamp(x, a, b, 0, Math.PI);
    const y = normalizeClamp(x, a, b, c, d);
    return y + (-battle.getUnitLength() * Math.sin(r)) / 4;
  });
  t.setOnComplete(() => {
    showParticleAtTarget(battle, {
      target,
      animName: explAnimName,
    });
    cb();
  });
  const p = new BattleParticle(battle, {
    transform: t,
    animName,
  });
  battle.addParticle(p);
}

export function showParticleAtTarget(battle, { animName, target, duration }) {
  if (!duration) {
    duration = display.getAnimationMs(animName);
  }
  const t = new Transform(duration);
  t.setAtTarget(target);
  const p = new BattleParticle(battle, {
    transform: t,
    animName,
  });
  battle.addParticle(p);
}

export function showDamageParticle(battle, victim, amt, color) {
  const textTransform = new Transform(constants.DAMAGED_TEXT_MS);
  textTransform.setAtTarget(victim);
  textTransform.setNormalizeFunc('y', (x, a, b, c, d) => {
    const r = normalizeEaseOutClamp(x, a, b, 0, Math.PI);
    const y = normalizeClamp(x, a, b, c, d);
    return y + (-battle.getUnitLength() * Math.sin(r)) / 3;
  });
  const textParticle = new BattleParticle(battle, {
    transform: textTransform,
    text: amt,
    textParams: {
      centered: true,
      size: battle.baseScale * 10,
      outline: true,
      color: color || '#F8F8F8',
      outlineSize: 1,
      fontStyle: 'bold',
      outlineColor: '#101E29',
    },
  });

  battle.addParticle(textParticle);
}
export function showStatusParticle(battle, victim, statusName, color) {
  const textTransform = new Transform(constants.STATUS_TEXT_MS);
  textTransform.setAtTarget(victim);
  textTransform.setNormalizeFunc('y', (x, a, b, c, d) => {
    const r = normalizeEaseOutClamp(x, a, b, 0, Math.PI / 2);
    const y = normalizeClamp(x, a, b, c, d);
    return y + battle.getUnitLength() / 6 - (Math.sin(r) * battle.getUnitLength()) / 12;
  });
  const textParticle = new BattleParticle(battle, {
    transform: textTransform,
    text: statusName,
    textParams: {
      centered: true,
      size: battle.baseScale * 9,
      outline: true,
      color: color || '#F8F8F8',
      outlineColor: '#101E29',
      outlineSize: 1,
      font: 'open sans',
      fontStyle: 'bold',
    },
  });

  battle.addParticle(textParticle);
}

export function dealDamage({ battle, victim, amt, damageType }) {
  showDamageParticle(battle, victim, amt, getColorFromDamageType(damageType));
  const t = new Transform(constants.DAMAGED_MS);
  t.setAnimationState('battleDamaged');
  t.setAtTarget(victim);
  if (damageType === 'shield') {
    victim.stats.modifyShield(-amt);
  } else if (damageType === 'health') {
    victim.stats.modifyHp(-amt);
  } else {
    victim.stats.modifyEffectiveHp(-amt);
  }
  t.setOnComplete(() => {
    victim.setAnimationState('battleReady');
  });
  victim.setTransform(t);
}
export function healDamage({ battle, target, amt, damageType }) {
  showDamageParticle(battle, target, amt, damageType);
  const t = new Transform(constants.DAMAGED_MS);
  t.setAtTarget(target);
  if (damageType === 'shield') {
    target.stats.modifyShield(amt);
  } else if (damageType === 'health') {
    target.stats.modifyHp(amt);
  } else {
    target.stats.modifyEffectiveHp(amt);
  }
  t.setOnComplete(() => {
    target.setAnimationState('battleReady');
  });
  target.setTransform(t);
}

export function addStatus({ battle, activator, target, statusName }) {
  const statusTemplate = getElem('statuses', statusName);
  const status = new BattleStatus({
    battleController: battle,
    statusTemplate,
    victim: target,
    activator,
  });
  target.stats.addStatus(status);

  showStatusParticle(battle, target, status.name, statusTemplate.statusColor);
}
