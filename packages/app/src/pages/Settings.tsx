import { useState } from 'react';
import { Field, Label, Listbox, Switch } from '@headlessui/react';
import { Cog6ToothIcon, ChevronUpDownIcon, CheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { CURRENCIES } from '../lib/currency';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    retry: false
  });

  const changePasswordMutation = useMutation({
    mutationFn: api.auth.changePassword,
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    },
    onError: (error: any) => {
      setPasswordError(error.message || 'Failed to change password');
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const updateMutation = useMutation({
    mutationFn: api.settings.update,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      const previousSettings = queryClient.getQueryData(['settings']);
      queryClient.setQueryData(['settings'], (old: any) => ({
        settings: { ...old?.settings, ...newData }
      }));
      return { previousSettings };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['settings'], context?.previousSettings);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const handleChange = (field: string, value: any) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('settings.title')}</h1>
      </div>

      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl space-y-12">
        {/* Change Password Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12 border-b border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Change password</h2>
              <p className="text-slate-400 text-sm">Update your password associated with your account.</p>
            </div>
            <div>
              {passwordError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}
              {changePasswordMutation.isSuccess && (
                <div className="mb-4 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                  Password changed successfully
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Field>
                  <Label className="block text-sm font-medium text-white mb-2">Current password</Label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field>
                  <Label className="block text-sm font-medium text-white mb-2">New password</Label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field>
                  <Label className="block text-sm font-medium text-white mb-2">Confirm password</Label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>
        </div>

        {/* Preferences Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Preferences</h2>
            <p className="text-slate-400 text-sm">Customize your application settings and preferences.</p>
          </div>
          <div className="space-y-5">
          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('settings.language')}</Label>
            <Listbox value={i18n.language} onChange={(value) => {
              i18n.changeLanguage(value);
              localStorage.setItem('language', value);
              handleChange('language', value);
            }}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{i18n.language === 'en' ? 'English' : 'Українська'}</span>
                  <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {[{ value: 'en', label: 'English' }, { value: 'uk', label: 'Українська' }].map((lang) => (
                    <Listbox.Option
                      key={lang.value}
                      value={lang.value}
                      className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span className={selected ? 'font-semibold text-white' : 'text-white'}>{lang.label}</span>
                          {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </Field>

          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('settings.preferredCurrency')}</Label>
            <Listbox value={settingsData?.settings?.preferredCurrency || 'USD'} onChange={(value) => handleChange('preferredCurrency', value)}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{CURRENCIES.find(c => c.code === (settingsData?.settings?.preferredCurrency || 'USD'))?.name || settingsData?.settings?.preferredCurrency || 'USD'}</span>
                  <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {CURRENCIES.map((curr) => (
                    <Listbox.Option
                      key={curr.code}
                      value={curr.code}
                      className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span className={selected ? 'font-semibold text-white' : 'text-white'}>{curr.symbol} {curr.code} - {curr.name}</span>
                          {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </Field>

          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('settings.units')}</Label>
            <Listbox value={settingsData?.settings?.units || 'imperial'} onChange={(value) => handleChange('units', value)}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{(settingsData?.settings?.units || 'imperial') === 'imperial' ? 'Imperial (Miles, Gallons)' : 'Metric (Kilometers, Liters)'}</span>
                  <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {[{ value: 'imperial', label: 'Imperial (Miles, Gallons)' }, { value: 'metric', label: 'Metric (Kilometers, Liters)' }].map((unit) => (
                    <Listbox.Option
                      key={unit.value}
                      value={unit.value}
                      className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span className={selected ? 'font-semibold text-white' : 'text-white'}>{unit.label}</span>
                          {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </Field>

          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('settings.dateFormat')}</Label>
            <Listbox value={settingsData?.settings?.dateFormat || 'MM/DD/YYYY'} onChange={(value) => handleChange('dateFormat', value)}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{settingsData?.settings?.dateFormat || 'MM/DD/YYYY'}</span>
                  <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((format) => (
                    <Listbox.Option
                      key={format}
                      value={format}
                      className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span className={selected ? 'font-semibold text-white' : 'text-white'}>{format}</span>
                          {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </Field>

          <Field className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-white">{t('settings.notifications')}</Label>
            <Switch
              checked={settingsData?.settings?.notifications ?? true}
              onChange={(value) => handleChange('notifications', value)}
              className={`${settingsData?.settings?.notifications ?? true ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <span className={`${settingsData?.settings?.notifications ?? true ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </Switch>
          </Field>
          </div>
        </div>

        {/* Logout Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Log out</h2>
              <p className="text-slate-400 text-sm">Sign out of your account on this device.</p>
            </div>
            <div>
              <button
                onClick={() => {
                  useAuthStore.getState().clearAuth();
                  window.location.href = '/login';
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                {t('navigation.logout')}
              </button>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
}
