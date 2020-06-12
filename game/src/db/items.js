const items = {};

function createTemplate(name) {
  const s = {
    name,
    animName: '',
    menuAnimName: '',
    talkTrigger: '',
    menuTalkTrigger: '',
    isBackground: false, // determines if this is always displayed behind other actors
  };
  if (items[name]) {
    throw new Error(`Two items exist with name "${name}"`);
  }
  items[name] = s;
  return s;
}

{
  const t = createTemplate('Small Rock');
  t.animName = 'small-rock';
  t.menuAnimName = 'items-SmallRock';
  t.talkTrigger = 'castle_entrance_grounds-getSmallRock';
  t.menuTalkTrigger = 'items-menu-SmallRock';
  t.isBackground = true;
}

export default items;
