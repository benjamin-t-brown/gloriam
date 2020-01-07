const stages = {};

function createTemplate(name) {
  const c = {
    name,
    displayName: name,
    bg: 'caveBg',
    fg: 'caveFg',
    floor: 'caveFloor',
  };
  if (stages[name]) {
    throw new Error(`Two stages exist with name "${name}"`);
  }
  stages[name] = c;
  return c;
}

{
  const s = createTemplate('cave');
  s.displayName = 'Default Cave';
}

export default stages;
