const items = {};

export interface ItemTemplate {
  name: string;
  itemName: string;
  animName: string;
  menuAnimName: string;
  talkTrigger: string;
  menuTalkTrigger: string;
  isBackground: boolean; // determines if this is always displayed behind other actors
}

function createTemplate(name: string): ItemTemplate {
  const s: ItemTemplate = {
    name,
    itemName: name,
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
  t.talkTrigger = 'east_window-talkTriggerSmallRock';
  t.menuTalkTrigger = 'items-mTalkTriggerSmallRock';
  t.isBackground = true;
}

export default items;
