/**
 * Centralized Redis key generators and TTL defaults for game rooms.
 */

export const REDIS_KEYS = {
  roomMeta: (pin: string) => `room:${pin}:meta`,
  roomPlayers: (pin: string) => `room:${pin}:players`,
  roomScores: (pin: string) => `room:${pin}:scores`,
  roomStreaks: (pin: string) => `room:${pin}:streaks`,
  roomAnswers: (pin: string, questionId: string) => `room:${pin}:answers:${questionId}`,
  roomAnsweredSet: (pin: string, questionId: string) => `room:${pin}:answered_set:${questionId}`,
  activeRooms: () => 'rooms:active',
};

// Default TTL buffer in seconds added to room duration to keep state in memory for analysis
export const ROOM_GRACE_PERIOD_SECONDS = 3600;

