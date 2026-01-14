import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

interface AIInsightsProps {
  vehicleId: string;
}

export const AIInsights = ({ vehicleId }: AIInsightsProps) => {
  const { t, i18n } = useTranslation();
  const [summaries, setSummaries] = useState<{ en: string; uk: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.insights.getMonthlySummary(vehicleId);
      setSummaries(result.summaries);
      setCached(result.cached || false);
    } catch (err: any) {
      const errorMsg = err.message || t('ai.error');
      setError(errorMsg);
      console.error('AI Insights Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentSummary = summaries ? (summaries[i18n.language as 'en' | 'uk'] || summaries.en) : null;

  console.log('AIInsights:', { summaries, currentLang: i18n.language, currentSummary });

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">{t('ai.insights')}</h3>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('ai.generating') : t('ai.generateSummary')}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4">{error}</div>
      )}

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      )}

      {currentSummary && !loading && (
        <div>
          <div 
            className="text-gray-300 leading-relaxed" 
            dangerouslySetInnerHTML={{ 
              __html: currentSummary
                .replace(/^##\s+(.+)$/gm, '<h3 class="text-xl font-bold text-white mt-6 mb-3">$1</h3>')
                .split('**').map((part, i) => i % 2 === 0 ? part : `<strong class="text-white font-semibold">${part}</strong>`).join('')
                .replace(/^(\d+\.\s)(.+)$/gm, '<div class="ml-4 mt-2">$1$2</div>')
                .replace(/\n\n/g, '<div class="mt-4"></div>')
                .replace(/\n/g, ' ')
            }} 
          />
          {cached && (
            <div className="mt-4 text-xs text-gray-500 italic">
              {t('ai.cached')}
            </div>
          )}
        </div>
      )}

      {!currentSummary && !loading && !error && (
        <p className="text-gray-400 text-sm">
          {t('ai.placeholder')}
        </p>
      )}
    </div>
  );
};
