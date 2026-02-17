import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Header from '../Header';
import { Search, X, ChevronDown, MoreHorizontal, Plus } from 'lucide-react';
import { Member } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const formatMemberDate = (ts: number): string => {
  const d = new Date(ts);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${hours}:${minutes}`;
};

const ROLE_LABELS: Record<Member['role'], string> = {
  owner: 'Владелец',
  admin: 'Админ',
  user: 'Пользователь',
};

const STATUS_LABELS: Record<Member['status'], string> = {
  active: 'активен',
  invited: 'приглашён',
};

interface MembersProps {
  project: Doc<"projects">;
  userId: Id<"users">;
}

const Members: React.FC<MembersProps> = ({ project, userId }) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [inviteError, setInviteError] = useState('');

  const rawMembers = useQuery(api.members.listByProject, {
    projectId: project._id,
    userId,
  });

  const inviteMutation = useMutation(api.members.invite);
  const updateRoleMutation = useMutation(api.members.updateRole);

  if (rawMembers === undefined) {
    return (
      <div>
        <Header projectName={project.name} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Участники</h1>
          <p className="text-gray-500 text-sm mt-1">Управление участниками, их доступом и взаимодействиями</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Map Convex members to display format
  const members = rawMembers.map(m => ({
    _id: m._id,
    id: m._id as string,
    phone: m.phone || m.email || '',
    email: m.email,
    name: m.name,
    status: m.status as 'active' | 'invited',
    role: m.role as 'owner' | 'admin' | 'user',
    invitedAt: m.invitedAt,
    joinedAt: m.joinedAt,
    userId: m.userId,
  }));

  const filteredMembers = members.filter(m =>
    m.phone.includes(searchQuery) || m.email.includes(searchQuery) || m.name.includes(searchQuery)
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteError('');
    try {
      await inviteMutation({
        projectId: project._id,
        userId,
        email: inviteEmail.trim(),
        phone: invitePhone.trim() || undefined,
        role: inviteRole,
      });
      setInviteEmail('');
      setInvitePhone('');
      setInviteRole('user');
      setShowInviteModal(false);
    } catch (err: any) {
      setInviteError(err.message || 'Ошибка при приглашении');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Member['role']) => {
    if (newRole === 'owner') return; // Cannot assign owner role
    try {
      await updateRoleMutation({
        memberId: memberId as Id<"members">,
        userId,
        newRole: newRole as 'admin' | 'user',
      });
    } catch (err: any) {
      console.error('Failed to update role:', err.message);
    }
  };

  return (
    <div>
      <Header projectName={project.name} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Участники</h1>
        <p className="text-gray-500 text-sm mt-1">Управление участниками, их доступом и взаимодействиями</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:bg-gray-200 transition-all h-10"
          />
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 h-10 bg-ordo-green text-white rounded-lg text-sm font-medium hover:bg-ordo-darkGreen transition-colors"
        >
          <Plus className="w-4 h-4" style={{ lineHeight: 0 }} />
          Пригласить
        </button>
      </div>

      {/* Members list */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredMembers.map(member => {
            const isCurrentUser = member.userId === userId;
            const dateDisplay = formatMemberDate(member.joinedAt ?? member.invitedAt);
            return (
              <div key={member.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{member.phone || member.email}</span>
                    {isCurrentUser && (
                      <span className="inline-flex items-center px-1.5 h-5 rounded-full text-[10px] font-medium bg-ordo-lightGreen text-ordo-green shrink-0">
                        вы
                      </span>
                    )}
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 -mr-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-ordo-lightGreen text-ordo-green'
                        : 'bg-amber-100/50 text-amber-700'
                    }`}>
                      {STATUS_LABELS[member.status]}
                    </span>
                    <span className="text-xs text-gray-400">{dateDisplay}</span>
                  </div>
                  <div className="relative inline-block">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as Member['role'])}
                      className="appearance-none bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green"
                    >
                      <option value="owner">Владелец</option>
                      <option value="admin">Админ</option>
                      <option value="user">Пользователь</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredMembers.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">Участники не найдены</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="bg-white text-left border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                  <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Участник</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Статус</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Дата регистрации</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map(member => {
                  const isCurrentUser = member.userId === userId;
                  const dateDisplay = formatMemberDate(member.joinedAt ?? member.invitedAt);

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{member.phone || member.email}</span>
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-1.5 h-6 rounded-full text-tiny font-medium bg-ordo-lightGreen text-ordo-green">
                              вы
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active'
                            ? 'bg-ordo-lightGreen text-ordo-green'
                            : 'bg-amber-100/50 text-amber-700'
                        }`}>
                          {STATUS_LABELS[member.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {dateDisplay}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative inline-block">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as Member['role'])}
                              className="appearance-none bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green"
                            >
                              <option value="owner">Владелец</option>
                              <option value="admin">Админ</option>
                              <option value="user">Пользователь</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8 text-sm">
                      Участники не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Пригласить участника</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона (необязательно)</label>
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600">
                    +7
                  </div>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="(7XX) XXX XX-XX"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <div className="relative">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green"
                  >
                    <option value="admin">Админ</option>
                    <option value="user">Пользователь</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {inviteError && (
                <p className="text-sm text-red-500">{inviteError}</p>
              )}

              <button
                onClick={handleInvite}
                className="w-full py-2.5 bg-ordo-green text-white rounded-lg text-sm font-medium hover:bg-ordo-darkGreen transition-colors mt-2"
              >
                Отправить приглашение
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
