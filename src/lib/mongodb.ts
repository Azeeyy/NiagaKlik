import mongoose from 'mongoose';
import dns from 'node:dns';

// Force DNS resolution to use reliable public DNS (fixes SRV lookup issues on some networks)
dns.setServers(['1.1.1.1', '8.8.8.8']);

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: Cached | undefined;
}

const cached = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI belum di-set');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
