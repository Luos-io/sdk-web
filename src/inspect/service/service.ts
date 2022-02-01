import { firmware } from 'inspect/service/firmware/index.js';
import { statistics } from 'inspect/service/statistics/index.js';

export * from 'inspect/service/firmware/index.js';
export * from 'inspect/service/statistics/index.js';

export const service = {
  firmware,
  statistics,
};
export default service;
