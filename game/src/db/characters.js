import theme from 'main/theme';
import { HEADINGS } from 'main/Actor';

const characters = {};

function createTemplate(name, battleOnly) {
  const c = {
    name,
    spriteBase: 'person',
    talkTrigger: '',
    skills: ['Punch', 'Shield Cracker', 'Defend', 'Counter'],
    hitBox: { width: 25, height: 52 },
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
  const c = createTemplate('Gate Guard');
  c.spriteBase = 'youngguard';
  c.talkTrigger = 'castle_entrance-GateGuard';
}

{
  const c = createTemplate('CorneliusLiber');
  c.spriteBase = 'cornelius';
  c.displayName = 'Cornelius Liber';
  c.textColor = theme.palette.lightPurple;
  c.talkTrigger = 'library_l1-CorneliusLiber';
  c.defaultHeading = HEADINGS.UP;
}

{
  const c = createTemplate('GardnerHarris');
  c.spriteBase = 'GardnerHarris';
  c.displayName = 'Gardner Harris';
  c.textColor = theme.palette.green;
  c.talkTrigger = 'gardens-GardnerHarris';
  c.defaultHeading = HEADINGS.UP;
}
{
  const c = createTemplate('KingsMaid');
  c.spriteBase = 'KingsMaid';
  c.talkTrigger = 'east_window-throwRock';
  c.animName = 'KingsMaid_default';
  c.useHeading = false;
}

{
  const c = createTemplate('Grif');
  c.spriteBase = 'grif';
}

{
  const c = createTemplate('Simmons');
  c.spriteBase = 'simmons';
}

export default characters;
