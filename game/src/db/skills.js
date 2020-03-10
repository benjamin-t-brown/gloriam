import { attackPhysical } from 'battle/Engine';
import {
  constants,
  jumpToAttackingPosition,
  jumpToDefaultPosition,
  createProjectile,
  showParticleAtTarget,
  dealDamage,
  healDamage,
  addStatus,
} from 'battle/BattleHelpers';

const skills = {};

export const SKILL_TYPES = [
  'default',
  'damage',
  'shield',
  'support',
  'special',
  'ultimate',
].reduce((prev, curr) => {
  prev[curr] = curr;
  return prev;
}, {});

function createTemplate(name) {
  const s = {
    name,
    displayName: name,
    cooldownDurationMs: 6000,
    skillType: SKILL_TYPES.default,
    events: [],
  };
  if (skills[name]) {
    throw new Error(`Two skills exist with name "${name}"`);
  }
  skills[name] = s;
  createEvent(s, {
    duration: 100,
    animState: 'battleReady',
  });
  return s;
}

function createEvent(skill, { duration, durationPadding, animState, particles, cb }) {
  const ev = {
    duration: duration || 100,
    animState: animState || null,
    particles: particles || [],
    durationPadding: durationPadding || 0,
    cb: cb || null,
    triggers: [],
  };
  skill.events.push(ev);
  return ev;
}

function createMeleeSkill({
  name,
  skillType,
  casterParticleName,
  targetParticleName,
  castDurationMs,
  onDamage,
}) {
  const s = createTemplate(name);
  s.skillType = skillType || SKILL_TYPES.damage;
  createEvent(s, {
    duration: constants.JUMP_MS,
    cb: (battle, activator, target) => {
      jumpToAttackingPosition(battle, activator, target);
    },
  });
  createEvent(s, {
    duration: 'anim',
    durationPadding: 400,
    animState: 'battleFlourish',
    cb: (battle, activator, target) => {
      if (casterParticleName) {
        showParticleAtTarget(battle, {
          activator,
          animName: casterParticleName,
        });
      }
    },
  });
  createEvent(s, {
    duration: 'anim',
    durationPadding: castDurationMs || 200,
    animState: 'battlePunch',
    cb: (battle, activator, target) => {
      battle.addTimer(castDurationMs || 200, () => {
        showParticleAtTarget(battle, {
          target,
          animName: targetParticleName,
        });
        onDamage(battle, activator, target);
      });
    },
  });
  createEvent(s, {
    duration: constants.JUMP_MS,
    cb: (battle, activator, target) => {
      jumpToDefaultPosition(battle, activator, target);
    },
  });
  createEvent(s, {
    duration: 700,
    animState: 'battleReady',
  });
}

function createCastingSkill({
  name,
  skillType,
  casterParticleName,
  targetParticleName,
  projectileParticleName,
  castDurationMs,
  onDamage,
}) {
  const s = createTemplate(name);
  s.skillType = skillType || SKILL_TYPES.damage;
  createEvent(s, {
    duration: 700,
    animState: 'battleChannel',
    cb: (battle, activator) => {
      showParticleAtTarget(battle, {
        animName: casterParticleName,
        target: activator,
        duration: 1000,
      });
    },
  });
  createEvent(s, {
    duration: castDurationMs || 500,
    animState: 'battlePunch',
    cb: (battle, activator, target) => {
      battle.addTimer(200, () => {
        if (projectileParticleName) {
          createProjectile(battle, activator, target, {
            animName: projectileParticleName,
            explAnimName: targetParticleName,
            cb: () => {
              onDamage(battle, activator, target);
            },
          });
        } else {
          onDamage(battle, activator, target);
        }
      });
    },
  });
  createEvent(s, {
    duration: 1000,
    animState: 'battleReady',
  });
}

// SKILLS --------------------------------------------------------------------------------
{
  createMeleeSkill({
    name: 'Punch',
    skillType: SKILL_TYPES.damage,
    targetParticleName: 'physicalStrike',
    onDamage: (battle, activator, target) => {
      dealDamage({
        battle,
        victim: target,
        amt: 10,
        damageType: 'default',
      });
    },
  });
}

// SHIELD ONLY DAMAGE SPELLS -------------------------------------------------------------
{
  createCastingSkill({
    name: 'Shield Cracker',
    skillType: SKILL_TYPES.shield,
    casterParticleName: 'channelHeal',
    projectileParticleName: 'shieldCracker',
    targetParticleName: 'shieldCrackerExpl',
    onDamage: (battle, activator, target) => {
      dealDamage({
        battle,
        victim: target,
        amt: 10,
        damageType: 'shield',
      });
    },
  });
}

// HEALING -------------------------------------------------------------------------------
{
  createCastingSkill({
    name: 'Aid',
    casterParticleName: 'channelHeal',
    onDamage: (battle, activator, target) => {
      dealDamage({
        battle,
        victim: target,
        amt: 10,
        damageType: 'default',
      });
    },
  });
}

{
  createCastingSkill({
    name: 'ReEmpower',
    casterParticleName: 'channelHeal',
    onDamage: (battle, activator, target) => {
      healDamage({
        battle,
        victim: target,
        amt: 10,
        damageType: 'shield',
      });
    },
  });
}

{
  createCastingSkill({
    name: 'Revitalize',
    casterParticleName: 'channelHeal',
    onDamage: (battle, activator, target) => {
      healDamage({
        battle,
        victim: target,
        amt: 10,
        damageType: 'health',
      });
    },
  });
}

// STATUSES ------------------------------------------------------------------------------
{
  createCastingSkill({
    name: 'Poison',
    skillType: SKILL_TYPES.special,
    casterParticleName: 'channelHeal',
    onDamage: (battle, activator, target) => {
      addStatus({
        battle,
        activator,
        target,
        statusName: 'Poison',
      });
    },
  });
}

// STANCES -------------------------------------------------------------------------------
{
  const s = createTemplate('Defend');
  createEvent(s, {
    duration: 100,
    animState: 'ready',
  });
  createEvent(s, {
    duration: 100,
    animState: 'defending',
    cb: activator => {
      activator.setStance('defending');
    },
  });
}

{
  const s = createTemplate('Counter');
  createEvent(s, {
    duration: 100,
    animState: 'ready',
  });
  createEvent(s, {
    duration: 100,
    animState: 'defending',
    cb: activator => {
      activator.setStance('defending');
    },
  });
}

export default skills;
