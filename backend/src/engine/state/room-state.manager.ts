import { getRedisClient } from '../../redis/client.js';
import { REDIS_KEYS } from '../../redis/keys.js';
import { RoomMeta, PlayerSession, PlayerScoreSummary } from '../types.js';

const SUBMIT_ANSWER_LUA = `
local answeredSetKey = KEYS[1]
local answersKey = KEYS[2]
local scoresKey = KEYS[3]

local playerId = ARGV[1]
local answerJson = ARGV[2]
local points = tonumber(ARGV[3]) or 0

-- Try adding to answeredSet (returns 1 if newly added, 0 if already present)
local isNew = redis.call('SADD', answeredSetKey, playerId)
if isNew == 1 then
  redis.call('HSET', answersKey, playerId, answerJson)
  if points > 0 then
    redis.call('ZINCRBY', scoresKey, points, playerId)
  else
    -- Ensure player exists in scores sorted set with 0 score
    redis.call('ZSCORE', scoresKey, playerId)
  end
  return 1
else
  return 0
end
`;

export class RoomStateManager {
  /**
   * Initializes or updates room metadata in Redis.
   */
  static async setRoomMeta(pin: string, meta: RoomMeta, ttlSeconds?: number): Promise<void> {
    const redis = getRedisClient();
    const metaKey = REDIS_KEYS.roomMeta(pin);

    const valuesToSet: Record<string, string> = {
      sessionId: meta.sessionId,
      professorId: meta.professorId,
      quizId: meta.quizId,
      pin: meta.pin,
      status: meta.status,
      currentQuestionIndex: meta.currentQuestionIndex.toString(),
      totalQuestions: meta.totalQuestions.toString(),
      expiresAt: meta.expiresAt,
    };

    if (meta.questionStartTimeMs !== undefined) {
      valuesToSet.questionStartTimeMs = meta.questionStartTimeMs.toString();
    }
    if (meta.questionTimeLimitMs !== undefined) {
      valuesToSet.questionTimeLimitMs = meta.questionTimeLimitMs.toString();
    }
    if (meta.questionBasePoints !== undefined) {
      valuesToSet.questionBasePoints = meta.questionBasePoints.toString();
    }
    if (meta.quizTitle !== undefined) {
      valuesToSet.quizTitle = meta.quizTitle;
    }
    if (meta.theme !== undefined) {
      valuesToSet.theme = JSON.stringify(meta.theme);
    }
    if (meta.executionMode !== undefined) {
      valuesToSet.executionMode = meta.executionMode;
    }

    await redis.hset(metaKey, valuesToSet);
    if (ttlSeconds) {
      await redis.expire(metaKey, ttlSeconds);
    }
    await redis.sadd(REDIS_KEYS.activeRooms(), pin);
  }

  /**
   * Retrieves room metadata.
   */
  static async getRoomMeta(pin: string): Promise<RoomMeta | null> {
    const redis = getRedisClient();
    const metaKey = REDIS_KEYS.roomMeta(pin);
    const data = await redis.hgetall(metaKey);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      sessionId: data.sessionId,
      professorId: data.professorId,
      quizId: data.quizId,
      pin: data.pin,
      status: data.status as RoomMeta['status'],
      currentQuestionIndex: parseInt(data.currentQuestionIndex || '-1', 10),
      totalQuestions: parseInt(data.totalQuestions || '0', 10),
      expiresAt: data.expiresAt,
      questionStartTimeMs: data.questionStartTimeMs ? parseInt(data.questionStartTimeMs, 10) : undefined,
      questionTimeLimitMs: data.questionTimeLimitMs ? parseInt(data.questionTimeLimitMs, 10) : undefined,
      questionBasePoints: data.questionBasePoints ? parseInt(data.questionBasePoints, 10) : undefined,
      quizTitle: data.quizTitle || undefined,
      theme: data.theme ? JSON.parse(data.theme) : undefined,
      executionMode: (data.executionMode as RoomMeta['executionMode']) || 'MANUAL',
    };
  }

  /**
   * Partially updates room metadata.
   */
  static async updateRoomMeta(pin: string, partial: Partial<RoomMeta>): Promise<void> {
    const redis = getRedisClient();
    const metaKey = REDIS_KEYS.roomMeta(pin);

    const valuesToSet: Record<string, string> = {};
    if (partial.status !== undefined) valuesToSet.status = partial.status;
    if (partial.currentQuestionIndex !== undefined) {
      valuesToSet.currentQuestionIndex = partial.currentQuestionIndex.toString();
    }
    if (partial.questionStartTimeMs !== undefined) {
      valuesToSet.questionStartTimeMs = partial.questionStartTimeMs.toString();
    }
    if (partial.questionTimeLimitMs !== undefined) {
      valuesToSet.questionTimeLimitMs = partial.questionTimeLimitMs.toString();
    }
    if (partial.questionBasePoints !== undefined) {
      valuesToSet.questionBasePoints = partial.questionBasePoints.toString();
    }
    if (partial.expiresAt !== undefined) {
      valuesToSet.expiresAt = partial.expiresAt;
    }
    if (partial.executionMode !== undefined) {
      valuesToSet.executionMode = partial.executionMode;
    }

    if (Object.keys(valuesToSet).length > 0) {
      await redis.hset(metaKey, valuesToSet);
    }
  }

  /**
   * Adds or registers a player in the room.
   */
  static async addPlayer(pin: string, player: PlayerSession): Promise<void> {
    const redis = getRedisClient();
    const playersKey = REDIS_KEYS.roomPlayers(pin);
    const scoresKey = REDIS_KEYS.roomScores(pin);
    const streaksKey = REDIS_KEYS.roomStreaks(pin);

    await redis.hset(playersKey, player.id, JSON.stringify(player));
    // Initialize score to 0 if not already present
    await redis.zadd(scoresKey, 'NX', 0, player.id);
    await redis.hset(streaksKey, player.id, '0');
  }

  /**
   * Retrieves player session.
   */
  static async getPlayer(pin: string, playerId: string): Promise<PlayerSession | null> {
    const redis = getRedisClient();
    const raw = await redis.hget(REDIS_KEYS.roomPlayers(pin), playerId);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  /**
   * Retrieves all players registered in the room.
   */
  static async getAllPlayers(pin: string): Promise<PlayerSession[]> {
    const redis = getRedisClient();
    const rawPlayers = await redis.hgetall(REDIS_KEYS.roomPlayers(pin));
    return Object.values(rawPlayers).map((raw) => JSON.parse(raw));
  }

  /**
   * Removes a player from the room.
   */
  static async removePlayer(pin: string, playerId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.hdel(REDIS_KEYS.roomPlayers(pin), playerId);
    await redis.zrem(REDIS_KEYS.roomScores(pin), playerId);
    await redis.hdel(REDIS_KEYS.roomStreaks(pin), playerId);
  }

  /**
   * Submits pupil answer atomically using Lua script.
   * Prevents race conditions and duplicate submissions.
   *
   * @returns true if answer was accepted, false if rejected (duplicate)
   */
  static async submitAnswerAtomic(
    pin: string,
    questionId: string,
    playerId: string,
    answerData: {
      optionId: string | null;
      responseTimeMs: number;
      isCorrect: boolean;
      pointsEarned: number;
      isEmpty?: boolean;
    },
    pointsEarned: number
  ): Promise<boolean> {
    const redis = getRedisClient();
    const answeredSetKey = REDIS_KEYS.roomAnsweredSet(pin, questionId);
    const answersKey = REDIS_KEYS.roomAnswers(pin, questionId);
    const scoresKey = REDIS_KEYS.roomScores(pin);

    const result = await redis.eval(
      SUBMIT_ANSWER_LUA,
      3,
      answeredSetKey,
      answersKey,
      scoresKey,
      playerId,
      JSON.stringify(answerData),
      pointsEarned.toString()
    );

    return result === 1;
  }

  /**
   * Retrieves all recorded answers for a specific question.
   */
  static async getAnswersForQuestion(
    pin: string,
    questionId: string
  ): Promise<Record<string, any>> {
    const redis = getRedisClient();
    const answersKey = REDIS_KEYS.roomAnswers(pin, questionId);
    const raw = await redis.hgetall(answersKey);

    const parsed: Record<string, any> = {};
    for (const [playerId, json] of Object.entries(raw)) {
      parsed[playerId] = JSON.parse(json);
    }
    return parsed;
  }

  /**
   * Gets current streak for player.
   */
  static async getStreak(pin: string, playerId: string): Promise<number> {
    const redis = getRedisClient();
    const raw = await redis.hget(REDIS_KEYS.roomStreaks(pin), playerId);
    return raw ? parseInt(raw, 10) : 0;
  }

  /**
   * Updates streak for player.
   */
  static async setStreak(pin: string, playerId: string, streak: number): Promise<void> {
    const redis = getRedisClient();
    await redis.hset(REDIS_KEYS.roomStreaks(pin), playerId, streak.toString());
  }

  /**
   * Retrieves top player leaderboard from Redis sorted set.
   */
  static async getLeaderboard(pin: string, limit = 5): Promise<PlayerScoreSummary[]> {
    const redis = getRedisClient();
    const scoresKey = REDIS_KEYS.roomScores(pin);
    const streaksKey = REDIS_KEYS.roomStreaks(pin);

    // ZREVRANGE with scores: [id1, score1, id2, score2, ...]
    const rawScores = await redis.zrevrange(scoresKey, 0, limit - 1, 'WITHSCORES');
    const players = await this.getAllPlayers(pin);
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const streaksRaw = await redis.hgetall(streaksKey);

    const results: PlayerScoreSummary[] = [];
    for (let i = 0; i < rawScores.length; i += 2) {
      const playerId = rawScores[i];
      const score = parseInt(rawScores[i + 1], 10);
      const player = playerMap.get(playerId);
      const streak = parseInt(streaksRaw[playerId] || '0', 10);

      results.push({
        playerId,
        nickname: player ? player.nickname : 'Player',
        score,
        streak,
        rank: Math.floor(i / 2) + 1,
      });
    }

    return results;
  }

  /**
   * Retrieves final rankings for all players.
   */
  static async getAllRankings(pin: string): Promise<PlayerScoreSummary[]> {
    return this.getLeaderboard(pin, 1000);
  }

  /**
   * Cleans up Redis keys after game completion.
   */
  static async cleanupRoom(pin: string): Promise<void> {
    const redis = getRedisClient();
    await redis.srem(REDIS_KEYS.activeRooms(), pin);
  }
}

