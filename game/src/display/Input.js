const input = {
  events: {
    keydown: {},
    keyup: {},
    mousedown: {},
    mousemove: {},
  },

  inputUIDisabled: false,

  isUIInputEnabled: function() {
    return !input.inputUIDisabled;
  },

  setUIInputDisabled: function(v) {
    input.inputUIDisabled = v;
  },

  pushEventListeners: function(name, listeners) {
    if (input.events[name]) {
      for (let keyName in listeners) {
        const cb = listeners[keyName];
        if (input.events[name][keyName]) {
          input.events[name][keyName].unshift(cb);
        } else {
          input.events[name][keyName] = [cb];
        }
      }
    }
  },

  popEventListeners: function(name, listeners) {
    if (input.events[name]) {
      for (let keyName in listeners) {
        if (input.events[name][keyName]) {
          input.events[name][keyName].shift();
        }
      }
    }
  },

  getEventCb(eventType, ev) {
    if (input.inputUIDisabled) {
      return;
    }

    if (eventType === 'keydown' || eventType === 'keyup') {
      if (input.events[eventType] && input.events[eventType][ev.key]) {
        return input.events[eventType][ev.key][0] || null;
      }
    } else if (eventType === 'mousedown') {
      if (input.events[eventType] && input.events[eventType][ev.which]) {
        return input.events[eventType] && input.events[eventType][ev.which][0];
      }
    }
    return null;
  },
};

window.addEventListener('keydown', ev => {
  console.log('KEYDOWN', ev);
  const cb = input.getEventCb('keydown', ev);
  if (cb) {
    cb(ev);
  }
});
window.addEventListener('keyup', ev => {
  const cb = input.getEventCb('keyup', ev);
  if (cb) {
    cb(ev);
  }
});
window.addEventListener('mousedown', ev => {
  // skip triggering these events when clicking ui elements (so buttons and such don't count for clicks)
  if (ev.target && ev.target.id && ev.target.id.includes('cmpt-game')) {
    const cb = input.getEventCb('mousedown', ev);
    if (cb) {
      cb(ev);
    }
  }
});
window.addEventListener('mousemove', ev => {
  const cb = input.getEventCb('mousemove', ev);
  if (cb) {
    cb(ev);
  }
});

window.input = input;

export default input;
