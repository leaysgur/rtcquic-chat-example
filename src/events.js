// from https://github.com/leader22/eve
export default class Eve {
  constructor() {
    this.events = {};
  }

  trigger(event, data) {
    let eventType;

    if (typeof event === 'string') {
      eventType = event;
      event = __createEmptyEvent(eventType);
    } else {
      eventType = event.type;
    }
    const eventParam = this._getEvent(eventType);

    event.data = (data !== undefined) ? data : null;
    eventParam.data = event;
    this._callHandlers(eventType);
  }

  on(eventType, handler) {
    const event = this._getEvent(eventType);
    const handlers = event.handlers;

    if (__getIndexByHandler(handlers, handler) > -1) {
      return false;
    }
    handlers[handlers.length] = __registerHandler(handler, false);
  }

  once(eventType, handler) {
    const event = this._getEvent(eventType);
    const handlers = event.handlers;

    if (__getIndexByHandler(handlers, handler) > -1) {
      return false;
    }
    handlers[handlers.length] = __registerHandler(handler, true);
  }

  off(eventType, handler) {
    const event = this._getEvent(eventType);

    if (handler === undefined) {
      delete this.events[eventType];
    } else {
      const handlers = event.handlers;
      const index = __getIndexByHandler(handlers, handler);

      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  _getEvent(eventType) {
    return this.events[eventType] || (this.events[eventType] = {
      isCalled: false,
      handlers: [],
      data: null
    });
  }

  _callHandlers(eventType) {
    const event = this._getEvent(eventType);
    const handlers = event.handlers;
    const data = event.data;
    const deletes = [];
    let i, val;

    // 何もすることがない
    if (handlers.length === 0) { return; }

    event.isCalled = true;
    for (i = 0;
      (val = handlers[i]); i++) {
      __fire(val.handler, data);
      // Note: onceは一度呼んだら消すので一旦arrayに取っておく
      if (val.isOnce) {
        deletes[deletes.length] = val;
      }
    }
    event.data = null;
    for (i = 0;
      (val = deletes[i]); i++) {
      const index = handlers.indexOf(val);

      handlers.splice(index, 1);
    }
  }
}

function __createEmptyEvent(type) {
    const event = window.document.createEvent('Event');

    event.initEvent(type, true, true);
    return event;
}

function __getIndexByHandler(handlers, handler) {
    for (let i = 0, val;
        (val = handlers[i]); i++) {
        if (val.handler === handler) {
            return i;
        }
    }
    return -1;
}

function __fire(handler, ev) {
  // handleEventがある場合はhandleEventをもれなく呼ぶ
  return handler.handleEvent ? handler.handleEvent(ev) :
    // 普通の関数ならそのまま呼ぶ
    handler(ev);
}

function __registerHandler(handler, isOnce) {
  return {
    handler: handler,
    isOnce:  !!isOnce
  };
}
