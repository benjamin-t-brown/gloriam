const encounters = {};

function createTemplate(name) {
  const e = {
    name,
    enemies: ['Stone Golem'],
    stageName: 'cave',
  };
  if (encounters[name]) {
    throw new Error(`Two encounters exist with name "${name}"`);
  }
  encounters[name] = e;
  return e;
}

{
  const e = createTemplate('test');
  e.enemies = ['Stone Golem', 'Stone Golem', 'Stone Golem'];
  e.stageName = 'cave';
}

{
  const e = createTemplate('test1');
  e.enemies = ['Stone Golem', 'Stone Golem'];
  e.stageName = 'cave';
}

export default encounters;
