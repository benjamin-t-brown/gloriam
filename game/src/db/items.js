const items = {};

function createTemplate(name) {
  const s = {
    name,
    animName: '',
  };
  if (items[name]) {
    throw new Error(`Two items exist with name "${name}"`);
  }
  items[name] = s;
  return s;
}

{
  const t = createTemplate('Small Rock');
  t.animName = 'items-SmallRock';
  t.talkTrigger = 'items-SmallRock';
}

export default items;
