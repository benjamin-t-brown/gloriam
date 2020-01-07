import {
  constants,
  jumpToAttackingPosition,
  jumpToDefaultPosition,
  createProjectile,
  showParticleAtTarget,
  dealDamage,
  healDamage,
} from 'battle/BattleHelpers';

const statuses = {};

function createTemplate(name) {
  const s = {
    name,
    statusColor: '#CFC6B8',
  };
  if (statuses[name]) {
    throw new Error(`Two statuses exist with name "${name}"`);
  }
  statuses[name] = s;
  return s;
}

function createIntervalStatus({
  name,
  durationMs,
  particleAnimName,
  intervalDurationMs,
  statusColor,
  onInterval,
}) {
  const s = createTemplate(name);
  s.durationMs = durationMs || Infinity;
  s.particleAnimName = particleAnimName;
  s.intervalDurationMs = intervalDurationMs;
  s.onInterval = onInterval;
  s.statusColor = statusColor;
  return s;
}

{
  createIntervalStatus({
    name: 'Poison',
    particleAnimName: 'statusPoison',
    intervalDurationMs: 4000,
    statusColor: '#71AA34',
    onInterval(statusEffect) {
      const { battleController: battle, activator, victim } = statusEffect;
      const amt = Math.round(activator.stats.getDamage() / 10);
      console.log('STATUS INTERVAL', amt);
      dealDamage({
        battle,
        victim,
        amt,
        damageType: 'health',
      });
    },
  });
}

export default statuses;
