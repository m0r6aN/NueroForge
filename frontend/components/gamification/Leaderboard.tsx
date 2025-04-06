// components/gamification/Leaderboard.tsx
"use client";

import React from "react";

export const Leaderboard: React.FC = () => {
  const mockData = [
    { id: 1, username: "Agent47", level: 15, xp: 1200 },
    { id: 2, username: "OperativeX", level: 12, xp: 1100 },
    { id: 3, username: "Shadow", level: 10, xp: 900 },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {mockData.map((user) => (
          <div
            key={user.id}
            className="flex justify-between p-2 bg-gray-800 rounded"
          >
            <span>{user.username}</span>
            <span>
              Lvl {user.level} | {user.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
