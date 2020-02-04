const props = {};

function createTemplate(name) {
  const c = {
    name,
    animName: '',
  };
  if (props[name]) {
    throw new Error(`Two props exist with name "${name}"`);
  }
  props[name] = c;
  return c;
}

{
  const s = createTemplate('banner1');
  s.animName = 'banner1-anim';
}

{
  const s = createTemplate('tree1');
  s.animName = 'tree1-anim';
}

{
  const s = createTemplate('tree2');
  s.animName = 'tree2-anim';
}

export default props;
