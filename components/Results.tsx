import React, { useMemo, useState } from 'react';
import { AnalysisResult } from '../types';
import { ExternalLink, UserMinus, Search, ArrowUpDown } from 'lucide-react';

interface ResultsProps {
  followers: AnalysisResult[];
  following: AnalysisResult[];
  onReset: () => void;
}

const Results: React.FC<ResultsProps> = ({ followers, following, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Logic: Find people in 'following' who are NOT in 'followers'
  const notFollowingBack = useMemo(() => {
    const followerSet = new Set(followers.map(f => f.username));
    return following.filter(u => !followerSet.has(u.username));
  }, [followers, following]);

  const filteredList = useMemo(() => {
    let list = [...notFollowingBack];
    
    // Filter by name
    if (searchTerm) {
      list = list.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    list.sort((a, b) => {
      const compare = a.username.localeCompare(b.username);
      return sortOrder === 'asc' ? compare : -compare;
    });

    return list;
  }, [notFollowingBack, searchTerm, sortOrder]);

  const formatTimestamp = (ts: number) => {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleDateString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Following</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{following.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Followers</h3>
          <p className="text-3xl font-bold text-emerald-500 dark:text-emerald-400 mt-2">{followers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-800 p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-sm">
          <h3 className="text-rose-600 dark:text-rose-300 text-sm font-medium uppercase tracking-wider">Not Following Back</h3>
          <p className="text-3xl font-bold text-rose-500 dark:text-rose-400 mt-2">{notFollowingBack.length}</p>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
        {/* Header / Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white pl-9 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                />
            </div>
            
            <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm transition-colors w-full sm:w-auto"
            >
                <ArrowUpDown className="w-4 h-4" />
                Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
        </div>

        {/* List Content */}
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
              <UserMinus className="w-12 h-12 mb-4 opacity-50" />
              <p>No users found matching your criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Username</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Follow Date</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredList.map((user) => (
                  <tr key={user.username} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user.username.substring(0, 2).toUpperCase()}
                         </div>
                         <span className="font-medium text-slate-800 dark:text-slate-200">{user.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {formatTimestamp(user.timestamp)}
                    </td>
                    <td className="p-4 text-right">
                      <a 
                        href={user.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-md text-sm font-medium transition-colors"
                      >
                        View Profile <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-center">
            <button 
                onClick={onReset}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm hover:underline transition-all"
            >
                Upload different files
            </button>
        </div>
      </div>
    </div>
  );
};

export default Results;