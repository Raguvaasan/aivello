import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiChevronDown, FiMinus } from 'react-icons/fi';
import { Navbar } from '../components/landing/Navbar';
import { IconWrapper } from '../components/common/IconWrapper';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { tools } from '../data/tools';

const toolPath = (id: string) => tools.find((tool) => tool.id === id)?.path;

const planFeatures = [
  `All ${tools.length} tools, free`,
  'No signup required to use tools',
  'Most tools run in your browser, so files never leave your device',
  'No usage caps on browser-based tools',
  'Light and dark mode on every device',
  'Optional free account for saved usage history',
];

interface ComparisonRow {
  feature: string;
  guest: boolean | string;
  account: boolean | string;
}

const comparison: ComparisonRow[] = [
  { feature: 'Every tool except the Background Remover', guest: true, account: true },
  { feature: 'Browser-side processing (files stay on your device)', guest: true, account: true },
  { feature: 'Background Remover (up to 20 images per hour)', guest: false, account: true },
  { feature: 'Saved tool usage history', guest: false, account: true },
  { feature: 'Price', guest: '$0', account: '$0' },
];

const thirdPartyTools = [
  { toolId: 'grammar-checker', tool: 'Grammar Checker', service: 'LanguageTool', url: 'https://languagetool.org/' },
  { toolId: 'language-translator', tool: 'Language Translator', service: 'MyMemory', url: 'https://mymemory.translated.net/' },
  { toolId: 'ai-image-generator', tool: 'AI Image Generator', service: 'Pollinations.ai', url: 'https://pollinations.ai/' },
  { toolId: 'url-shortener', tool: 'URL Shortener', service: 'is.gd', url: 'https://is.gd/' },
  { toolId: 'bg-remover', tool: 'Background Remover', service: 'remove.bg', url: 'https://www.remove.bg/' },
];

const textLink =
  'font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200';
const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950';

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'Is Aivello really free?',
    answer: (
      <p>
        Yes. Every tool is free to use, with no paid plans, no trials and no credit card. There is nothing to upgrade
        to.
      </p>
    ),
  },
  {
    question: 'How is Aivello funded?',
    answer: (
      <p>
        Aivello shows unobtrusive ads (Google AdSense). That covers hosting and the few paid services behind some
        tools. The project is also{' '}
        <a href="https://github.com/Raguvaasan/aivello" target="_blank" rel="noopener noreferrer" className={textLink}>
          open source on GitHub
        </a>
        .
      </p>
    ),
  },
  {
    question: 'Do I need an account?',
    answer: (
      <p>
        No. You only need a free account (sign in with Google or GitHub) to keep a history of the tools you use and to
        use the Background Remover, which runs on a paid API.
      </p>
    ),
  },
  {
    question: 'Do you store my files?',
    answer: (
      <p>
        No. Browser-based tools process your text and files locally on your device; they are never uploaded to us. If
        you sign in, we only store which tool you used, what you did and when, never the content you put in or get out.
      </p>
    ),
  },
  {
    question: 'Which tools send data to a third party?',
    answer: (
      <>
        <p className="mb-3">A handful of tools need an outside service to work. They send only what the tool needs:</p>
        <ul className="space-y-2">
          {thirdPartyTools.map((entry) => {
            const path = toolPath(entry.toolId);
            return (
              <li key={entry.toolId} className="flex flex-wrap items-center gap-x-2">
                {path ? (
                  <Link to={path} className={textLink}>
                    {entry.tool}
                  </Link>
                ) : (
                  <span className="font-medium">{entry.tool}</span>
                )}
                <IconWrapper icon={FiArrowRight} className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">uses</span>
                <a href={entry.url} target="_blank" rel="noopener noreferrer" className={textLink}>
                  {entry.service}
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-3">
          Details are in the{' '}
          <Link to="/privacy" className={textLink}>
            privacy policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    question: 'Why is the Background Remover limited?',
    answer: (
      <p>
        It is the one tool that runs on a paid API, so it needs a free account and is limited to 20 images per hour per
        account. That keeps it free for everyone.
      </p>
    ),
  },
];

const Cell: React.FC<{ value: boolean | string }> = ({ value }) => {
  if (typeof value === 'string') {
    return <span className="font-semibold text-gray-900 dark:text-white">{value}</span>;
  }
  return value ? (
    <>
      <IconWrapper icon={FiCheck} className="mx-auto h-5 w-5 text-green-700 dark:text-green-400" />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <IconWrapper icon={FiMinus} className="mx-auto h-5 w-5 text-gray-400 dark:text-gray-500" />
      <span className="sr-only">Not included</span>
    </>
  );
};

const PricingPage: React.FC = () => {
  return (
    <>
      <SEOHelmet
        title="Pricing: Free Forever - Aivello"
        description={`Every Aivello tool is free forever: ${tools.length} tools, no paid plans, no signup, no credit card. Most tools run in your browser, so your files stay on your device.`}
        keywords="free online tools, free AI tools, no signup, free forever, pricing"
        url="https://aivello.vercel.app/pricing"
      />

      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-white">
        <Navbar />

        <main id="main-content" tabIndex={-1} className="pt-24 pb-20 focus:outline-none sm:pt-32">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <header className="mx-auto mb-12 max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Pricing:{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                  free forever
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl">
                One plan, and it costs nothing. No tiers, no trials, no credit card.
              </p>
            </header>

            <section
              aria-labelledby="plan-heading"
              className="mx-auto max-w-xl rounded-3xl border-2 border-purple-200 bg-white p-6 shadow-xl shadow-purple-500/10 dark:border-purple-400/30 dark:bg-white/5 dark:shadow-none sm:p-10"
            >
              <p className="mb-4 inline-flex rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                The only plan
              </p>
              <h2 id="plan-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
                Free
              </h2>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                <span className="text-lg text-gray-600 dark:text-gray-300">forever</span>
              </p>
              <p className="mt-3 text-gray-600 dark:text-gray-300">Everything Aivello offers, for everyone.</p>

              <ul className="my-8 space-y-3">
                {planFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <IconWrapper icon={FiCheck} className="mt-0.5 h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/app"
                className={`group flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/40 ${focusRing}`}
              >
                Start using tools
                <IconWrapper icon={FiArrowRight} className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                No credit card. No trial. No account required.
              </p>
            </section>

            <section aria-labelledby="compare-heading" className="mt-16 sm:mt-20">
              <h2
                id="compare-heading"
                className="mb-3 text-center text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
              >
                Do you need an account?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-center text-gray-600 dark:text-gray-300">
                Probably not. An account is optional and also free. Sign in with Google or GitHub only if you want the
                extras below.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white/80 dark:border-white/10 dark:bg-white/5">
                <table className="w-full text-left text-sm sm:text-base">
                  <caption className="sr-only">What you get without an account and with a free account</caption>
                  <thead className="border-b border-gray-200 text-gray-900 dark:border-white/10 dark:text-white">
                    <tr>
                      <th scope="col" className="p-3 font-semibold sm:p-4">
                        Feature
                      </th>
                      <th scope="col" className="w-24 p-3 text-center font-semibold sm:w-40 sm:p-4">
                        Without account
                      </th>
                      <th scope="col" className="w-24 p-3 text-center font-semibold sm:w-40 sm:p-4">
                        With free account
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                    {comparison.map((row) => (
                      <tr key={row.feature}>
                        <th scope="row" className="p-3 font-normal text-gray-700 dark:text-gray-200 sm:p-4">
                          {row.feature}
                        </th>
                        <td className="p-3 text-center sm:p-4">
                          <Cell value={row.guest} />
                        </td>
                        <td className="p-3 text-center sm:p-4">
                          <Cell value={row.account} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="faq-heading" className="mx-auto mt-16 max-w-3xl sm:mt-20">
              <h2
                id="faq-heading"
                className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
              >
                Frequently asked questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-2xl border border-gray-200 bg-white/80 dark:border-white/10 dark:bg-white/5"
                  >
                    <summary
                      className={`flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 font-semibold text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden ${focusRing}`}
                    >
                      {faq.question}
                      <IconWrapper
                        icon={FiChevronDown}
                        className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180 dark:text-gray-400"
                      />
                    </summary>
                    <div className="px-5 pb-5 leading-relaxed text-gray-600 dark:text-gray-300">{faq.answer}</div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default PricingPage;
