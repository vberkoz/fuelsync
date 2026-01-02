import { useState } from 'react';
import { Field, Label, Listbox, Switch } from '@headlessui/react';
import { Cog6ToothIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { CURRENCIES } from '../lib/currency';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ units: 'imperial', dateFormat: 'MM/DD/YYYY', notifications: true, language: i18n.language, preferredCurrency: 'USD' });

  const { isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    retry: false
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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

      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('settings.language')}</Label>
            <Listbox value={formData.language} onChange={(value) => {
              setFormData({ ...formData, language: value });
              i18n.changeLanguage(value);
              localStorage.setItem('language', value);
              updateMutation.mutate({ ...formData, language: value });
            }}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{formData.language === 'en' ? 'English' : 'Українська'}</span>
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
            <Label className="block text-sm font-semibold text-white mb-1.5">Preferred Currency</Label>
            <Listbox value={formData.preferredCurrency} onChange={(value) => setFormData({ ...formData, preferredCurrency: value })}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{CURRENCIES.find(c => c.code === formData.preferredCurrency)?.name || formData.preferredCurrency}</span>
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
            <Listbox value={formData.units} onChange={(value) => setFormData({ ...formData, units: value })}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{formData.units === 'imperial' ? 'Imperial (Miles, Gallons)' : 'Metric (Kilometers, Liters)'}</span>
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
            <Listbox value={formData.dateFormat} onChange={(value) => setFormData({ ...formData, dateFormat: value })}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{formData.dateFormat}</span>
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
              checked={formData.notifications}
              onChange={(value) => setFormData({ ...formData, notifications: value })}
              className={`${formData.notifications ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <span className={`${formData.notifications ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </Switch>
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
