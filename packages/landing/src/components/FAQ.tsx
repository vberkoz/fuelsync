import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: 'How does FuelSync track my vehicle expenses?',
    answer: 'FuelSync allows you to manually log refills, maintenance, and other expenses. The app automatically calculates fuel consumption and provides analytics.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, all data is encrypted and stored securely on AWS infrastructure with industry-standard security practices.',
  },
  {
    question: 'Can I track multiple vehicles?',
    answer: 'Yes, you can add and manage multiple vehicles in your account.',
  },
];

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq) => (
          <Disclosure key={faq.question}>
            {({ open }) => (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
                <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left">
                  <span className="text-white font-medium">{faq.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-blue-400 transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="px-6 pb-4 text-gray-400">
                  {faq.answer}
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
