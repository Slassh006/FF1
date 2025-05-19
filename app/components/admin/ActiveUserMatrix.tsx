import React, { useEffect, useState } from 'react';

export default function ActiveUserMatrix() {
  const [users, setUsers] = useState<{ ip: string; lastSeen: number }[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('/api/active-users');
      const data = await res.json();
      setUsers(data.users || []);
      setCount(data.count || 0);
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black rounded-xl p-6 mt-8 shadow-lg border border-green-500/30">
      <h2 className="text-2xl font-mono text-green-400 mb-4 tracking-widest animate-pulse text-center">
        Active User
      </h2>
      <div className="text-5xl font-mono text-green-400 mb-6 text-center drop-shadow-glow animate-glow">
        {count}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 justify-center">
        {users.map((user, idx) => (
          <div
            key={user.ip}
            className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-green-300 font-mono text-xs text-center shadow-md animate-matrix-flicker"
            style={{
              animationDelay: `${(idx % 10) * 0.1}s`,
              filter: 'drop-shadow(0 0 6px #00ff99)',
            }}
          >
            {user.ip}
            <div className="text-green-500/60 text-[10px] mt-1">
              {new Date(user.lastSeen).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .animate-glow {
          animation: glow 1.5s infinite alternate;
        }
        @keyframes glow {
          from { text-shadow: 0 0 10px #00ff99, 0 0 20px #00ff99; }
          to { text-shadow: 0 0 30px #00ff99, 0 0 60px #00ff99; }
        }
        .animate-matrix-flicker {
          animation: matrix-flicker 2s infinite alternate;
        }
        @keyframes matrix-flicker {
          0% { opacity: 0.8; }
          50% { opacity: 1; filter: brightness(1.2); }
          100% { opacity: 0.7; }
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px #00ff99);
        }
      `}</style>
    </div>
  );
} 