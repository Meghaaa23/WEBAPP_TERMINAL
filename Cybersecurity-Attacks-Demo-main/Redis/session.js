// Redis/session.js 

class UserSessionManager {
  constructor(redisClient, hostName) {
    this.redis = redisClient;
    this.hostName = hostName;
    this.TTL = {
      terminalState: 7 * 24 * 60 * 60,      // 7 days
      activeSession: 24 * 60 * 60,           // 24 hours
      historicalSession: 30 * 24 * 60 * 60,  // 30 days
      userProfile: 90 * 24 * 60 * 60         // 90 days
    };
  }

  async getOrCreateUser(userId, metadata = {}) {
    const userKey = `user:${userId}`;
    const exists = await this.redis.exists(userKey);
    
    const now = new Date().toISOString();
    
    if (!exists) {
      // New user
      const userData = {
        userId: userId,
        userType: userId.startsWith('anon_') ? 'anonymous' : 'authenticated',
        firstSeen: now,
        lastSeen: now,
        totalSessions: '0',
        totalCommands: '0',
        ipAddress: metadata.ip || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
        status: 'new'
      };
      
      await this.redis.hmset(userKey, userData);
      await this.redis.expire(userKey, this.TTL.userProfile);
      
      // Add to sets
      await this.redis.sadd('users:all', userId);
      if (userData.userType === 'anonymous') {
        await this.redis.sadd('users:anonymous', userId);
      } else {
        await this.redis.sadd('users:authenticated', userId);
      }
      
      console.log(` New user: ${userId} (${userData.userType})`);
      return { isNew: true, user: userData };
    } else {
      // Returning user
      await this.redis.hmset(userKey, {
        lastSeen: now,
        status: 'returning'
      });
      await this.redis.expire(userKey, this.TTL.userProfile);
      
      const user = await this.redis.hgetall(userKey);
      console.log(` Returning user: ${userId}`);
      return { isNew: false, user };
    }
  }

  async saveTerminalState(userId, state) {
    const stateKey = `terminal:${userId}:${this.hostName}:state`;
    
    const stateData = {
      history: (state.history || '').slice(-100000), // Last 100KB
      cwd: state.cwd || '/home/azureuser/Playground',
      commandHistory: JSON.stringify((state.commandHistory || []).slice(-100)),
      lastCommand: state.lastCommand || '',
      lastUpdated: new Date().toISOString()
    };
    
    await this.redis.hmset(stateKey, stateData);
    await this.redis.expire(stateKey, this.TTL.terminalState);
    
    console.log(` Saved state for ${userId} on ${this.hostName}`);
  }

  async restoreTerminalState(userId) {
    const stateKey = `terminal:${userId}:${this.hostName}:state`;
    const state = await this.redis.hgetall(stateKey);
    
    if (!state || Object.keys(state).length === 0) {
      return null;
    }
    
    return {
      history: state.history || '',
      cwd: state.cwd || '/home/azureuser/Playground',
      commandHistory: JSON.parse(state.commandHistory || '[]'),
      lastCommand: state.lastCommand || '',
      lastUpdated: state.lastUpdated
    };
  }

  async createSession(userId, sessionId, metadata = {}) {
    const sessionKey = `session:${userId}:${this.hostName}:${sessionId}`;
    const currentKey = `session:${userId}:${this.hostName}:current`;
    
    const sessionData = {
      sessionId: sessionId,
      userId: userId,
      host: this.hostName,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      commandCount: '0',
      commands: '[]',
      status: 'active',
      ipAddress: metadata.ip || '',
      userAgent: metadata.userAgent || ''
    };
    
    await this.redis.hmset(sessionKey, sessionData);
    await this.redis.hmset(currentKey, sessionData);
    await this.redis.expire(sessionKey, this.TTL.historicalSession);
    await this.redis.expire(currentKey, this.TTL.activeSession);
    
    // Add to active sets
    await this.redis.sadd('sessions:active', sessionId);
    await this.redis.sadd('users:active', userId);
    
    // Increment user's session count
    await this.redis.hincrby(`user:${userId}`, 'totalSessions', 1);
    
    return sessionData;
  }

  async updateSession(userId, sessionId, updates) {
    const sessionKey = `session:${userId}:${this.hostName}:${sessionId}`;
    const currentKey = `session:${userId}:${this.hostName}:current`;
    
    const updateData = {
      lastActivity: new Date().toISOString(),
      ...updates
    };
    
    await this.redis.hmset(sessionKey, updateData);
    await this.redis.hmset(currentKey, updateData);
    await this.redis.expire(sessionKey, this.TTL.historicalSession);
    await this.redis.expire(currentKey, this.TTL.activeSession);
  }

  async closeSession(userId, sessionId) {
    const sessionKey = `session:${userId}:${this.hostName}:${sessionId}`;
    
    await this.redis.hmset(sessionKey, {
      status: 'closed',
      endTime: new Date().toISOString()
    });
    
    await this.redis.srem('sessions:active', sessionId);
    
    // Check if user has other active sessions
    const userSessions = await this.redis.smembers('sessions:active');
    const hasOtherSessions = userSessions.some(sid => 
      sid.startsWith(`${userId}:`)
    );
    
    if (!hasOtherSessions) {
      await this.redis.srem('users:active', userId);
    }
  }

  async getStats() {
    const [activeUsers, totalUsers, activeSessions, anonUsers, authUsers] = await Promise.all([
      this.redis.scard('users:active'),
      this.redis.scard('users:all'),
      this.redis.scard('sessions:active'),
      this.redis.scard('users:anonymous'),
      this.redis.scard('users:authenticated')
    ]);
    
    return {
      activeUsers,
      totalUsers,
      activeSessions,
      anonymousUsers: anonUsers,
      authenticatedUsers: authUsers,
      host: this.hostName,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = UserSessionManager;