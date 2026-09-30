import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import { Navbar } from '../../components/landing/Navbar';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { IconWrapper } from '../../components/common/IconWrapper';
import { seoData } from '../../data/seoData';

const LAST_UPDATED = 'September 30, 2026';
const CONTACT_EMAIL = 'support@aivello.com';

const sectionCard =
  'rounded-2xl border border-gray-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5 sm:p-6';
const sectionHeading = 'mb-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl';
const textLink =
  'font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200';

const Terms: React.FC = () => {
  return (
    <>
      <SEOHelmet
        title={seoData.pages.terms.title}
        description={seoData.pages.terms.description}
        keywords={seoData.pages.terms.keywords}
        url="https://aivello.vercel.app/terms"
      />
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-white">
        <Navbar />

        <main id="main-content" tabIndex={-1} className="pt-24 pb-20 focus:outline-none sm:pt-32">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6">
            <header className="mb-10 text-center sm:mb-12">
              <div
                aria-hidden="true"
                className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
              >
                <IconWrapper icon={FiFileText} className="h-7 w-7" />
              </div>
              <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Terms of Service
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                Please read these terms carefully before using Aivello.
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
            </header>

            <div className="space-y-5 leading-relaxed text-gray-600 dark:text-gray-300">
              <section className={sectionCard} aria-labelledby="terms-intro">
                <h2 id="terms-intro" className={sectionHeading}>
                  1. Introduction
                </h2>
                <p>
                  Welcome to Aivello. By using our service, you agree to these terms. Please read them carefully. These
                  terms govern your use of our free online tools and services.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-using">
                <h2 id="terms-using" className={sectionHeading}>
                  2. Using our Services
                </h2>
                <p>
                  You must follow any policies made available to you within the Services. You may use our Services only
                  as permitted by law. We may suspend or stop providing our Services to you if you do not comply with
                  our terms or policies or if we detect any misuse of our tools.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-privacy">
                <h2 id="terms-privacy" className={sectionHeading}>
                  3. Privacy and Copyright Protection
                </h2>
                <p>
                  Our{' '}
                  <Link to="/privacy" className={textLink}>
                    privacy policy
                  </Link>{' '}
                  explains how we treat your personal data and protect your privacy when you use our Services. We are
                  committed to protecting your data and being transparent about how our tools process it.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-content">
                <h2 id="terms-content" className={sectionHeading}>
                  4. Your Content in our Services
                </h2>
                <p>
                  You retain ownership of any intellectual property rights that you hold in the content you submit or
                  upload to our Services. Most tools process your content entirely in your browser. Where a tool needs
                  a server or a third-party service, your content is sent only to produce the result you asked for. We
                  do not use your content to train AI models.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-limits">
                <h2 id="terms-limits" className={sectionHeading}>
                  5. Usage Limits and Fair Use
                </h2>
                <p>
                  All tools are free. We may set limits on the use of our Services to protect our systems and keep them
                  reliable for everyone. For example, the Background Remover requires a free account and is limited to
                  20 images per hour, because it relies on a paid service.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-ai">
                <h2 id="terms-ai" className={sectionHeading}>
                  6. AI-Generated Content
                </h2>
                <p>
                  Content generated by our tools is provided &quot;as-is&quot; and should be reviewed before use. While
                  we strive for accuracy, generated content may contain errors or biases. Users are responsible for
                  verifying and validating any generated content before use.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-third-party">
                <h2 id="terms-third-party" className={sectionHeading}>
                  7. Third-Party Services
                </h2>
                <p>
                  A few tools rely on third-party services (listed in our{' '}
                  <Link to="/privacy" className={textLink}>
                    privacy policy
                  </Link>
                  ). Their availability is outside our control, and their own terms apply to what they process.
                </p>
              </section>

              <section className={sectionCard} aria-labelledby="terms-contact">
                <h2 id="terms-contact" className={sectionHeading}>
                  8. Changes and Contact
                </h2>
                <p>
                  We may update these terms from time to time; the date at the top of this page shows the latest
                  revision. Questions? Email{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={textLink}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </section>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-6 dark:border-white/10">
              <Link
                to="/"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg font-medium text-purple-700 hover:text-purple-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 dark:text-purple-300 dark:hover:text-purple-200"
              >
                <IconWrapper icon={FiArrowLeft} className="h-5 w-5" />
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Terms;
