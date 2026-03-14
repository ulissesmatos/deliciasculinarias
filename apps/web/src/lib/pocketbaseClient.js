import Pocketbase from 'pocketbase';

const isServer = typeof window === 'undefined';

// Server-side: connect directly to PocketBase (same container, no nginx proxy)
// Client-side: use nginx reverse proxy path
const POCKETBASE_API_URL = isServer
  ? (process.env.PB_URL || 'http://127.0.0.1:8090')
  : '/hcgi/platform';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;

export { pocketbaseClient };
