'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface DashboardData {
  suspiciousAccounts: SuspiciousAccount[];
  rapidLevelers: User[];
  inactiveAlts: User[];
  suspiciousUsernames: User[];
  topIps: IpData[];
  stats: {
    suspiciousCount: number;
    recentRegistrations: number;
    behavioralFlags: number;
  };
}

interface SuspiciousAccount {
  id: number;
  username: string;
  level: number;
  suspiciousScore: number;
  accountFlags: string[];
  registrationIp: string;
  lastLoginIp: string;
  deviceFingerprints: string[];
  isSuspicious: boolean;
  tempBanUntil: string | null;
  banReason: string | null;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  level: number;
  registrationIp: string;
  deviceFingerprints: string[];
  createdAt: string;
}

interface IpData {
  ip: string;
  accountCount: number;
}

export default function AdminSecurityPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const response = await api.get<DashboardData>(
        '/admin/security/dashboard',
      );
      setDashboard(response.data);
      setError(null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const tempBan = async (userId: number, duration: number = 86400) => {
    if (!confirm(`Ban user for ${duration / 3600} hours?`)) return;

    try {
      await api.post('/admin/security/temp-ban', {
        userId,
        duration,
        reason: 'Suspicious activity detected by admin',
      });
      alert('User banned successfully');
      fetchDashboard();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Failed to ban user: ${error.message}`);
    }
  };

  const permaBan = async (userId: number) => {
    if (!confirm('Permanently ban this user?')) return;

    try {
      await api.post('/admin/security/temp-ban', {
        userId,
        duration: 999999999,
        reason: 'Permanently banned by admin',
      });
      alert('User permanently banned');
      fetchDashboard();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Failed to ban user: ${error.message}`);
    }
  };

  const banIP = async (ip: string, duration: number = 86400) => {
    if (!confirm(`Ban IP ${ip} for ${duration / 3600} hours?`)) return;

    try {
      await api.post('/admin/security/ban-ip', {
        ip,
        duration,
      });
      alert('IP banned successfully');
      fetchDashboard();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Failed to ban IP: ${error.message}`);
    }
  };

  const unban = async (userId: number) => {
    if (!confirm('Unban this user?')) return;

    try {
      await api.post('/admin/security/unban', { userId });
      alert('User unbanned successfully');
      fetchDashboard();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Failed to unban user: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading security dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Suspicious Accounts"
          value={dashboard?.stats?.suspiciousCount || 0}
          color="red"
        />
        <StatCard
          title="Recent Registrations (1h)"
          value={dashboard?.stats?.recentRegistrations || 0}
          color="blue"
        />
        <StatCard
          title="Top Multi-Account IPs"
          value={dashboard?.topIps?.length || 0}
          color="orange"
        />
        <StatCard
          title="Behavioral Flags (24h)"
          value={dashboard?.stats?.behavioralFlags || 0}
          color="purple"
        />
      </div>

      {/* Suspicious Accounts Table */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Suspicious Accounts ({dashboard?.suspiciousAccounts?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Flags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IPs
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Devices
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.suspiciousAccounts?.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {account.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {account.level}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded ${
                        account.suspiciousScore > 70
                          ? 'bg-red-100 text-red-800'
                          : account.suspiciousScore > 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {account.suspiciousScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {account.accountFlags?.join(', ') || 'None'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Reg: {account.registrationIp}</div>
                      <div className="text-xs text-gray-400">
                        Last: {account.lastLoginIp}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {account.deviceFingerprints?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {account.tempBanUntil ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Banned until{' '}
                        {new Date(account.tempBanUntil).toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    {account.tempBanUntil ? (
                      <button
                        onClick={() => unban(account.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Unban
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => tempBan(account.id, 3600)}
                          className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                        >
                          1h
                        </button>
                        <button
                          onClick={() => tempBan(account.id, 86400)}
                          className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                        >
                          24h
                        </button>
                        <button
                          onClick={() => permaBan(account.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Perma
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Multi-Account IPs */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Top Multi-Account IPs ({dashboard?.topIps?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.topIps?.map((ipData) => (
                <tr key={ipData.ip} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {ipData.ip}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 rounded ${
                        ipData.accountCount > 10
                          ? 'bg-red-100 text-red-800'
                          : ipData.accountCount > 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ipData.accountCount} accounts
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => banIP(ipData.ip, 3600)}
                      className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                    >
                      Ban 1h
                    </button>
                    <button
                      onClick={() => banIP(ipData.ip, 86400)}
                      className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                    >
                      Ban 24h
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rapid Levelers */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Rapid Levelers (6h) ({dashboard?.rapidLevelers?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registration IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Devices
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.rapidLevelers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.level}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.registrationIp}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.deviceFingerprints?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inactive Alts */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Inactive Alt Accounts (30d+) ({dashboard?.inactiveAlts?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registration IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.inactiveAlts?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.level}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.registrationIp}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Suspicious Username Patterns */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Suspicious Username Patterns (
          {dashboard?.suspiciousUsernames?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registration IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.suspiciousUsernames?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.level}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.registrationIp}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: 'red' | 'blue' | 'orange' | 'purple';
}) {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-full ${colorClasses[color]} mr-4`} />
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
