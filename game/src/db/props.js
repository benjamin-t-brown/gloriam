const props = {};

function createTemplate(name) {
  const s = {
    name,
    animName: '',
  };
  if (props[name]) {
    throw new Error(`Two props exist with name "${name}"`);
  }
  props[name] = s;
  return s;
}

{
  const s = createTemplate('banner1-prop');
  s.animName = 'banner1-anim';
}

{
  const s = createTemplate('tree1-prop');
  s.animName = 'tree1-anim';
}

{
  const s = createTemplate('tree2-prop');
  s.animName = 'tree2-anim';
}

{
  const s = createTemplate('pond');
  s.animName = 'pond-animation';
  s.isBackground = true;
  s.zOrdering = -2;
}

{
  const s = createTemplate('bridge-prop');
  s.isBackground = true;
  s.zOrdering = -1;
}

{
  const s = createTemplate('flower1-prop');
  s.animName = 'flower1-anim';
}

{
  const s = createTemplate('flower2-prop');
  s.animName = 'flower2-anim';
}

{
  const s = createTemplate('flower3-prop');
  s.animName = 'flower3-anim';
}

{
  const s = createTemplate('flower4-prop');
  s.animName = 'flower4-anim';
}

export default props;
