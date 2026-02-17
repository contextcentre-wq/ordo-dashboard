import React, { useState } from 'react';
import Header from '../Header';
import { Search, X, ChevronDown, MoreHorizontal, Plus } from 'lucide-react';
import { Member } from '../../types';

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const formatMemberDate = (iso: string, time: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${time}`;
};

const mockMembers: Member[] = [
  { id: 'm1', phone: '+7 (747) 319 10-04', status: 'active', registrationDate: '2024-12-01', role: 'owner' },
  { id: 'm2', phone: '+7 (778) 407 68-86', status: 'active', registrationDate: '2025-02-13', role: 'admin' },
  { id: 'm3', phone: '+7 (705) 825 55-16', status: 'invited', registrationDate: '2025-02-13', role: 'user' },
  { id: 'm4', phone: '+7 (706) 666 76-96', status: 'active', registrationDate: '2025-01-20', role: 'user' },
];

const ROLE_LABELS: Record<Member['role'], string> = {
  owner: 'Владелец',
  admin: 'Админ',
  user: 'Пользователь',
};

const STATUS_LABELS: Record<Member['status'], string> = {
  active: 'активен',
  invited: 'приглашён',
};

const CURRENT_USER_ID = 'm1';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<Member['role']>('user');

  const filteredMembers = members.filter(m =>
    m.phone.includes(searchQuery)
  );

  const handleInvite = () => {
    if (!invitePhone.trim()) return;
    const newMember: Member = {
      id: `m${Date.now()}`,
      phone: invitePhone,
      status: 'invited',
      registrationDate: new Date().toISOString().split('T')[0],
      role: inviteRole,
    };
    setMembers(prev => [...prev, newMember]);
    setInvitePhone('');
    setInviteRole('user');
    setShowInviteModal(false);
  };

  const handleRoleChange = (id: string, newRole: Member['role']) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  return (
    <div>
      <Header />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Участники</h1>
        <p className="text-gray-500 text-sm mt-1">Управление участниками, их доступом и взаимодействиями</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative w-72">
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

      {/* Members table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr className="bg-white text-left border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Участник</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Статус</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Дата регистрации</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map(member => {
                const isCurrentUser = member.id === CURRENT_USER_ID;
                const dateDisplay = formatMemberDate(
                  member.registrationDate,
                  member.id === 'm1' ? '17:57' : member.id === 'm2' ? '14:29' : member.id === 'm3' ? '14:29' : '09:15'
                );

                return (
                  <tr key={member.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{member.phone}</span>
                        {isCurrentUser && (
                          <span className="inline-flex items-center px-1.5 h-6 rounded-full text-tiny font-medium bg-ordo-lightGreen text-ordo-green">
                            вы
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-ordo-lightGreen text-ordo-green'
                          : 'bg-amber-100/50 text-amber-700'
                      }`}>
                        {STATUS_LABELS[member.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 hidden sm:table-cell">
                      {dateDisplay}
                    </td>
                    <td className="px-3 py-2">
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
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона</label>
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600">
                    &#x1F1F0;&#x1F1FF; +7
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
                    onChange={(e) => setInviteRole(e.target.value as Member['role'])}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green"
                  >
                    <option value="admin">Админ</option>
                    <option value="user">Пользователь</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

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
