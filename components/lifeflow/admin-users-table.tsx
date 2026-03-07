'use client';

import React, { useState } from 'react';
import { Search, Eye, MoreVertical, AlertCircle } from 'lucide-react';

interface User {
  id: number;
  avatar: string;
  username: string;
  email: string;
  joinedDate: string;
  tasksCount: number;
  streak: number;
  status: 'Active' | 'Inactive';
}

const mockUsers: User[] = [
  {
    id: 1,
    avatar: 'A',
    username: 'alex_dev',
    email: 'alex@example.com',
    joinedDate: '2024-01-15',
    tasksCount: 42,
    streak: 12,
    status: 'Active',
  },
  {
    id: 2,
    avatar: 'J',
    username: 'jordan_tasks',
    email: 'jordan@example.com',
    joinedDate: '2024-02-01',
    tasksCount: 28,
    streak: 8,
    status: 'Active',
  },
  {
    id: 3,
    avatar: 'S',
    username: 'sarah_productivity',
    email: 'sarah@example.com',
    joinedDate: '2024-01-28',
    tasksCount: 156,
    streak: 35,
    status: 'Active',
  },
  {
    id: 4,
    avatar: 'M',
    username: 'mike_casual',
    email: 'mike@example.com',
    joinedDate: '2023-12-10',
    tasksCount: 15,
    streak: 0,
    status: 'Inactive',
  },
  {
    id: 5,
    avatar: 'E',
    username: 'emma_organizer',
    email: 'emma@example.com',
    joinedDate: '2024-01-05',
    tasksCount: 89,
    streak: 28,
    status: 'Active',
  },
];

interface AdminUsersTableProps {
  onSearch?: (query: string) => void;
}

export function AdminUsersTable({ onSearch }: AdminUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || user.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass rounded-lg border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['All', 'Active', 'Inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === status
                  ? 'bg-gradient-purple-pink/30 text-purple-200 border border-purple-500/50'
                  : 'glass text-white/70 hover:text-white hover:border-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-b border-white/10 transition-colors ${
                    index % 2 === 0 ? 'bg-white/[2%]' : 'bg-transparent'
                  } hover:bg-white/10`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-purple-pink flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.avatar}
                      </div>
                      <span className="font-medium text-white">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-white/70 text-sm">
                    {new Date(user.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center text-white font-medium">{user.tasksCount}</td>
                  <td className="px-6 py-4 text-center">
                    {user.streak > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium">
                        🔥 {user.streak}
                      </span>
                    ) : (
                      <span className="text-white/40 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.status === 'Active'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {user.status === 'Active' ? '●' : '○'} {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View Profile">
                        <Eye size={16} className="text-white/60 hover:text-white" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group" title="Deactivate">
                        <MoreVertical size={16} className="text-white/60 group-hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && (
          <div className="p-8 text-center">
            <AlertCircle size={32} className="mx-auto text-white/40 mb-3" />
            <p className="text-white/60">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 glass rounded-lg text-sm font-medium text-white/70 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-gradient-purple-pink/30 text-purple-200 border border-purple-500/50'
                    : 'glass text-white/70 hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 glass rounded-lg text-sm font-medium text-white/70 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
