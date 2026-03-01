import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({
    url: redisUrl
});

let isConnected = false;

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => {
    isConnected = true;
    console.log('✅ Redis connected successfully');
});

export const connectRedis = async () => {
    if (!isConnected) {
        try {
            await client.connect();
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error);

        }
    }
};

export const isRedisConnected = (): boolean => isConnected;


// Get data from cache

export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!isConnected) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        return null;
    }
};


// Set data to cache with optional TTL (in seconds)

export const setCache = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    if (!isConnected) return;
    try {
        const stringValue = JSON.stringify(value);
        await client.set(key, stringValue, {
            EX: ttl
        });
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
};


// Delete data from cache

export const deleteCache = async (key: string): Promise<void> => {
    if (!isConnected) return;
    try {
        await client.del(key);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error);
    }
};


// Delete multiple keys matching a pattern

export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
    if (!isConnected) return;
    try {
        const iterator = client.scanIterator({
            MATCH: pattern,
            COUNT: 100 // Process in batches
        });

        for await (const key of iterator) {
            await client.del(key);
        }
    } catch (error) {
        console.error(`Error deleting cache by pattern ${pattern}:`, error);
    }
};


// Disconnect from Redis

export const disconnectRedis = async (): Promise<void> => {
    if (isConnected) {
        try {
            await client.destroy(); // destroy is forceful, quit is graceful. destroy is usually better for cleanup.
            isConnected = false;
            console.log('✅ Redis disconnected successfully');
        } catch (error) {
            console.error('❌ Error disconnecting from Redis:', error);
        }
    }
};

export default {
    connectRedis,
    isRedisConnected,
    getCache,
    setCache,
    deleteCache,
    deleteCacheByPattern,
    disconnectRedis
};
