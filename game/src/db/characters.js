import theme from 'main/theme';

const characters = {};

function createTemplate(name, battleOnly) {
  const c = {
    name,
    spriteBase: 'person',
    skills: ['Punch', 'Shield Cracker', 'Defend', 'Counter'],
    baseHp: 10,
    baseShieldHp: 0,
    battleOnly: battleOnly === undefined ? false : true,
    POW: 1,
    ACC: 1,
    FOR: 1,
    CON: 1,
    RES: 1,
    SPD: 1,
    EVA: 1,
    animState: '',
    behaviorIntervalCb: () => {},
    onCreate: () => {},
    onRemove: () => {},
  };
  if (characters[name]) {
    throw new Error(`Two characters exist with name "${name}"`);
  }
  characters[name] = c;
  return c;
}

{
  const c = createTemplate('Ferelith');
  c.spriteBase = 'ferelith';
  c.textColor = theme.palette.lightRed;
  c.skills = ['Poison', 'Shield Cracker'];
  c.POW = 15;
  c.ACC = 8;
  c.FOR = 8;
  c.CON = 7;
  c.RES = 12;
  c.SPD = 13;
  c.EVA = 10;
  c.baseHp = 100;
  c.baseShieldHp = 15;
}

{
  const c = createTemplate('Rydo');
  c.spriteBase = 'rydo';
  c.textColor = theme.palette.lightBlue;
  c.skills = ['Poison', 'Shield Cracker', 'Punch'];
  c.POW = 15;
  c.ACC = 8;
  c.FOR = 8;
  c.CON = 12;
  c.RES = 5;
  c.SPD = 13;
  c.EVA = 10;
  c.baseHp = 100;
  c.baseShieldHp = 15;
}

{
  const c = createTemplate('Stone Golem', true);
  c.spriteBase = 'golemA';
  c.skills = ['Poison', 'Poison', 'Punch'];
  c.POW = 8;
  c.ACC = 5;
  c.FOR = 12;
  c.CON = 12;
  c.RES = 5;
  c.SPD = 8;
  c.EVA = 5;
  c.baseHp = 100;
  c.baseShieldHp = 15;
}

{
  const c = createTemplate('Young Guard');
  c.spriteBase = 'youngguard';
}

export default characters;
