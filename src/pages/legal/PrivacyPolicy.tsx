import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { Navbar } from '../../components/landing/Navbar';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { IconWrapper } from '../../components/common/IconWrapper';
import { seoData } from '../../data/seoData';
import { tools } from '../../data/tools';

const LAST_UPDATED = 'September 30, 2026';
const CONTACT_EMAIL = 'support@aivello.com';

const toolPath = (id: string) => tools.find((tool) => tool.id === id)?.path;

const thirdPartyTools = [
  {
    toolId: 'grammar-checker',
    tool: 'Grammar Checker',
    service: 'LanguageTool',
    url: 'https://languagetool.org/legal/privacy',
    sends: 'the text you check',
  },
  {
    toolId: 'language-translator',
    tool: 'Language Translator',
    service: 'MyMemory (Translated)',
    url: 'https://mymemory.translated.net/',
    sends: 'the text you translate',
  },
  {
    toolId: 'ai-image-generator',
    tool: 'AI Image Generator',
    service: 'Pollinations.ai',
    url: 'https://pollinations.ai/',
    sends: 'your image prompt; the generated images are loaded from their servers',
  },
  {
    toolId: 'url-shortener',
    tool: 'URL Shortener',
    service: 'is.gd',
    url: 'https://is.gd/privacy.php',
    sends: 'the link you shorten',
  },
  {
    toolId: 'bg-remover',
    tool: 'Background Remover',
    service: 'remove.bg',
    url: 'https://www.remove.bg/privacy',
    sends: 'the image you upload, relayed through our server (requires sign-in)',
  },
];

const sectionCard =
  'rounded-2xl border border-gray-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5 sm:p-6';
const sectionHeading = 'mb-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl';
const list = 'list-disc space-y-2 pl-6';
const strong = 'font-semibold text-gray-900 dark:text-white';
const textLink =
  'font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200';

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={textLink}>
    {children}
  </a>
);

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section className={sectionCard} aria-labelledby={id}>
    <h2 id={id} className={sectionHeading}>
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHelmet
        title={seoData.pages.privacy.title}
        description={seoData.pages.privacy.description}
        keywords={seoData.pages.privacy.keywords}
        url="https://aivello.vercel.app/privacy"
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
                <IconWrapper icon={FiLock} className="h-7 w-7" />
              </div>
              <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Privacy Policy
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                What Aivello collects, what it does not, and who else is involved.
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
            </header>

            <div className="space-y-5 leading-relaxed text-gray-600 dark:text-gray-300">
              <section
                aria-labelledby="privacy-summary"
                className="rounded-2xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-400/30 dark:bg-purple-500/10 sm:p-6"
              >
                <h2 id="privacy-summary" className={sectionHeading}>
                  The short version
                </h2>
                <ul className={list}>
                  <li>You can use every tool without an account.</li>
                  <li>Most tools run entirely in your browser. Your files and text never reach our servers.</li>
                  <li>
                    If you sign in, we store your basic profile and a record of which tools you used and when, never
                    the content you put into a tool or get out of it.
                  </li>
                  <li>A few tools send your input to a named third-party service, listed below.</li>
                  <li>We use Google Analytics and Google AdSense, which set cookies.</li>
                  <li>We do not sell your personal information.</li>
                </ul>
              </section>

              <Section id="privacy-who" title="1. Who we are">
                <p>
                  Aivello (aivello.vercel.app) is a free collection of online tools, built and maintained by an
                  independent developer. For any privacy question or request, email{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={textLink}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </Section>

              <Section id="privacy-browser" title="2. Tools that run in your browser">
                <p>
                  Most tools, including the PDF, image, resume, QR code, text and developer tools, process everything
                  locally with JavaScript on your device. The files you open and the text you type are not uploaded to
                  us, and we have no copy of them or of the results.
                </p>
              </Section>

              <Section id="privacy-third-party" title="3. Tools that use third-party services">
                <p>
                  These tools need an outside service to work. When you use them, only what the tool needs is sent
                  directly to that service, and its own privacy policy applies:
                </p>
                <ul className="space-y-3">
                  {thirdPartyTools.map((entry) => {
                    const path = toolPath(entry.toolId);
                    return (
                      <li key={entry.toolId}>
                        {path ? (
                          <Link to={path} className={textLink}>
                            {entry.tool}
                          </Link>
                        ) : (
                          <span className={strong}>{entry.tool}</span>
                        )}{' '}
                        uses <ExternalLink href={entry.url}>{entry.service}</ExternalLink>: {entry.sends}.
                      </li>
                    );
                  })}
                </ul>
                <p>Also good to know:</p>
                <ul className={list}>
                  <li>
                    <span className={strong}>YouTube Thumbnail</span> loads thumbnail images directly from YouTube, which
                    receives the video ID.
                  </li>
                  <li>
                    <span className={strong}>AI Speech to Text</span> and <span className={strong}>Text to Speech</span>{' '}
                    use your browser&apos;s built-in speech features. Some browsers (for example Chrome) process speech
                    on their vendor&apos;s servers.
                  </li>
                </ul>
              </Section>

              <Section id="privacy-account" title="4. Optional account">
                <p>
                  Signing in is optional. It is handled by{' '}
                  <ExternalLink href="https://firebase.google.com/support/privacy">Firebase Authentication</ExternalLink>{' '}
                  (Google), with your Google or GitHub account. We never see your password.
                </p>
                <p>If you sign in, we store the following in Google Cloud Firestore:</p>
                <ul className={list}>
                  <li>
                    <span className={strong}>Your profile:</span> your user ID, name, email address and profile photo
                    URL as provided by Google or GitHub, when you first and last signed in, and your preferences.
                  </li>
                  <li>
                    <span className={strong}>Tool usage records:</span> which tool you used (tool ID and name), what you
                    did (for example &quot;generate&quot; or &quot;download&quot;), when, and sometimes how long it took.
                    This powers your History page.
                  </li>
                </ul>
                <p>
                  We do <span className={strong}>not</span> store the text, files or results you put into or get out of
                  any tool. Our database rules only let you read your own records.
                </p>
              </Section>

              <Section id="privacy-cookies" title="5. Analytics and advertising cookies">
                <p>To understand how the site is used and to keep it free, we use two Google services:</p>
                <ul className={list}>
                  <li>
                    <span className={strong}>Google Analytics</span> records pages visited, the referring site, device
                    and browser type, approximate location derived from your IP address, page performance and error
                    reports. You can opt out with the{' '}
                    <ExternalLink href="https://tools.google.com/dlpage/gaoptout">
                      Google Analytics opt-out add-on
                    </ExternalLink>
                    .
                  </li>
                  <li>
                    <span className={strong}>Google AdSense</span> shows ads. Google and its partners may use cookies to
                    show ads based on your visits to this and other sites. You can turn off personalized ads in{' '}
                    <ExternalLink href="https://myadcenter.google.com/">My Ad Center</ExternalLink>.
                  </li>
                </ul>
                <p>
                  Learn more about{' '}
                  <ExternalLink href="https://policies.google.com/technologies/partner-sites">
                    how Google uses information from sites that use its services
                  </ExternalLink>
                  .
                </p>
              </Section>

              <Section id="privacy-local" title="6. Data stored in your browser">
                <p>
                  Some data is kept only on your device, in your browser&apos;s local storage, and never sent to us:
                </p>
                <ul className={list}>
                  <li>Your light, dark or system theme choice.</li>
                  <li>
                    Local tool history, such as the links you shortened with the URL Shortener, so you can find them
                    again.
                  </li>
                  <li>
                    A small flag that remembers you are signed in, plus the Firebase sign-in session itself (stored by
                    Firebase in your browser).
                  </li>
                </ul>
                <p>You can remove all of it at any time by clearing this site&apos;s data in your browser settings.</p>
              </Section>

              <Section id="privacy-use" title="7. How we use information">
                <ul className={list}>
                  <li>To sign you in and show your tool history.</li>
                  <li>To understand which tools are useful, and to find and fix errors.</li>
                  <li>To keep the service free through advertising.</li>
                  <li>To prevent abuse, for example the hourly limit on the Background Remover.</li>
                </ul>
                <p>We do not sell your personal information, and we do not use your content to train AI models.</p>
              </Section>

              <Section id="privacy-retention" title="8. Retention and deletion">
                <p>
                  Account data and tool usage records are kept while your account exists. To delete your account and
                  all associated records, email{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={textLink}>
                    {CONTACT_EMAIL}
                  </a>{' '}
                  from the address you signed in with. Data stored in your browser stays there until you clear it.
                </p>
              </Section>

              <Section id="privacy-rights" title="9. Your rights">
                <p>Depending on where you live, you may have the right to:</p>
                <ul className={list}>
                  <li>Access the personal information we hold about you, or get a copy of it</li>
                  <li>Correct or delete it</li>
                  <li>Object to or restrict certain processing, such as personalized advertising</li>
                  <li>Complain to your local data protection authority</li>
                </ul>
                <p>To exercise any of these, contact us at the address above.</p>
              </Section>

              <Section id="privacy-children" title="10. Children">
                <p>
                  Aivello is not directed at children under 13, and we do not knowingly collect personal information
                  from them. If you believe a child has created an account, contact us and we will delete it.
                </p>
              </Section>

              <Section id="privacy-security" title="11. Security">
                <p>
                  The site is served only over HTTPS, and account data is protected by Firebase Authentication and
                  database rules that restrict each record to its owner. No online service is perfectly secure, but we
                  keep what we collect to a minimum.
                </p>
              </Section>

              <Section id="privacy-changes" title="12. Changes to this policy">
                <p>
                  We may update this policy as the service changes. The &quot;Last updated&quot; date at the top of this
                  page always shows the current revision.
                </p>
              </Section>

              <Section id="privacy-contact" title="13. Contact">
                <p>
                  Questions or requests about your privacy:{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={textLink}>
                    {CONTACT_EMAIL}
                  </a>
                  . See also our{' '}
                  <Link to="/terms" className={textLink}>
                    Terms of Service
                  </Link>
                  .
                </p>
              </Section>
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

export default PrivacyPolicy;
