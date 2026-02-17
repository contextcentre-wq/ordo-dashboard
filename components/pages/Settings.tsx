import React, { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Header from '../Header';

interface SettingsProps {
  project: Doc<"projects">;
  userId: Id<"users">;
  onDeleted: () => void;
}

const Settings: React.FC<SettingsProps> = ({ project, userId, onDeleted }) => {
  const [dashboardName, setDashboardName] = useState(project.name);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // CRM integration state
  const [crmProvider, setCrmProvider] = useState<'amocrm' | 'bitrix24' | ''>(
    project.crmProvider ?? ''
  );

  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  const webhookUrl = crmProvider
    ? `${import.meta.env.VITE_CONVEX_SITE_URL ?? 'https://friendly-cardinal-359.convex.site'}/webhooks/${crmProvider}/${project._id}`
    : '';

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProject({
        projectId: project._id,
        userId,
        name: dashboardName,
        ...(crmProvider ? { crmProvider: crmProvider as 'amocrm' | 'bitrix24' } : {}),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('Failed to save settings:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие необратимо.')) return;
    setDeleting(true);
    try {
      await removeProject({ projectId: project._id, userId });
      onDeleted();
    } catch (err: any) {
      console.error('Failed to delete project:', err.message);
    } finally {
      setDeleting(false);
    }
  };

  let saveButtonLabel = 'Сохранить';
  if (saving) saveButtonLabel = 'Сохранение...';
  else if (saveSuccess) saveButtonLabel = 'Сохранено!';

  return (
    <div>
      <Header projectName={project.name} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 text-sm mt-1">Основные настройки дашборда</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Основные</h2>

        <div className="space-y-6">
          {/* Dashboard name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Название дашборда</label>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green outline-none transition-all bg-gray-100 text-gray-900"
            />
          </div>

          {/* Status toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700">Статус</label>
              <p className="text-xs text-gray-400 mt-0.5">{isActive ? 'Дашборд активен' : 'Дашборд неактивен'}</p>
            </div>
            <div className="flex md:justify-end">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isActive ? 'bg-ordo-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Integration section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Интеграция с CRM</h2>

        <div className="space-y-6">
          {/* CRM Provider selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">CRM система</label>
            <select
              value={crmProvider}
              onChange={(e) => setCrmProvider(e.target.value as 'amocrm' | 'bitrix24' | '')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green outline-none transition-all bg-gray-100 text-gray-900 appearance-none"
            >
              <option value="">Не выбрана</option>
              <option value="amocrm">AmoCRM</option>
              <option value="bitrix24">Bitrix24</option>
            </select>
          </div>

          {/* Webhook URL */}
          {crmProvider && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-start">
              <div>
                <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                <p className="text-xs text-gray-400 mt-0.5">Укажите этот URL в настройках вашей CRM</p>
              </div>
              <input
                type="text"
                value={webhookUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm cursor-pointer outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-2xl mt-6 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-ordo-green text-white rounded-lg text-sm font-medium hover:bg-ordo-darkGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveButtonLabel}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-5 py-2.5 bg-gray-100 text-red-500 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? 'Удаление...' : 'Удалить дашборд'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
