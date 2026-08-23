import { createRequire } from 'node:module';
import worker from './worker.js';

// `import.meta.url` is stripped when Wrangler bundles this module. An absolute
// virtual path keeps `createRequire` valid in workerd; the generated bundle only
// uses it for Node built-ins such as `fs`, `path`, and `async_hooks`.
globalThis.require ??= createRequire('/worker.js');

export {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from './worker.js';

export default worker;
