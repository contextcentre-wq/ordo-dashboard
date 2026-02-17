import React, { useState } from 'react';
import { FolderOpen, FolderPlus, ChevronRight, Plus } from 'lucide-react';
import { Project } from '../types';

interface ProjectSelectProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
}

const ProjectSelect: React.FC<ProjectSelectProps> = ({ projects, onSelectProject, onCreateProject }) => {
  const [showCreateForm, setShowCreateForm] = useState(projects.length === 0);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProject(trimmed);
    setNewName('');
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Выберите проект</h2>
          <p className="text-gray-500 text-sm">Выберите проект для работы или создайте новый</p>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FolderPlus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-6">У вас пока нет проектов. Создайте первый!</p>
          </div>
        )}

        {projects.length > 0 && (
          <div className="space-y-2 mb-6">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-ordo-green/30 hover:bg-emerald-50/30 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5 text-ordo-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{project.name}</div>
                  <div className="text-xs text-gray-400">{project.createdAt}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-ordo-green transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}

        {showCreateForm ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Название проекта"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-ordo-green text-white rounded-xl text-sm font-medium hover:bg-ordo-darkGreen transition-colors"
              >
                Создать
              </button>
              {projects.length > 0 && (
                <button
                  onClick={() => { setShowCreateForm(false); setNewName(''); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-ordo-green/40 hover:text-ordo-green transition-colors"
          >
            <Plus className="w-4 h-4" />
            Создать новый проект
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectSelect;
