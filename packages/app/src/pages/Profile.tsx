import { useState } from 'react';
import { Field, Label, Listbox } from '@headlessui/react';
import { UserCircleIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function Profile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userEmail = useAuthStore((state) => state.userEmail);
  const [formData, setFormData] = useState({ name: '', currency: 'USD' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: api.profile.get,
    retry: false
  });

  const updateMutation = useMutation({
    mutationFn: api.profile.update,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previousProfile = queryClient.getQueryData(['profile']);
      queryClient.setQueryData(['profile'], (old: any) => ({
        profile: { ...old?.profile, ...newData }
      }));
      return { previousProfile };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['profile'], context?.previousProfile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('profile.loading')}</p>
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
        <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('profile.title')}</h1>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('profile.email')}</Label>
            <input
              type="email"
              value={userEmail || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
            />
          </Field>

          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('profile.name')}</Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={data?.profile?.name || 'Enter your name'}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>

          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('profile.currency')}</Label>
            <Listbox value={formData.currency} onChange={(value) => setFormData({ ...formData, currency: value })}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{formData.currency === 'USD' ? 'USD ($)' : formData.currency === 'EUR' ? 'EUR (€)' : formData.currency === 'GBP' ? 'GBP (£)' : 'UAH (₴)'}</span>
                  <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {[{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }, { value: 'UAH', label: 'UAH (₴)' }].map((currency) => (
                    <Listbox.Option
                      key={currency.value}
                      value={currency.value}
                      className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span className={selected ? 'font-semibold text-white' : 'text-white'}>{currency.label}</span>
                          {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </Field>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {updateMutation.isPending ? t('common.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
