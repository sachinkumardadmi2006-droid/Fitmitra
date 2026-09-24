// Simple EventEmitter singleton to replace window.dispatchEvent/addEventListener
// Used for cross-component data refresh when AsyncStorage changes

import EventEmitter from 'eventemitter3';

const emitter = new EventEmitter();

export const DB_UPDATE_EVENT = 'fitmitra_db_update';

export const emitDbUpdate = () => {
  emitter.emit(DB_UPDATE_EVENT);
};

export const onDbUpdate = (callback) => {
  emitter.on(DB_UPDATE_EVENT, callback);
  return () => emitter.off(DB_UPDATE_EVENT, callback);
};

export default emitter;
