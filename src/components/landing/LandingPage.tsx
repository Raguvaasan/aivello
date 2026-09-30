import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiGithub, FiHeart, FiMail } from 'react-icons/fi';
import { Features } from './Features';
import { Hero } from './Hero';
import { Navbar } from './Navbar';
import { SEOHelmet } from '../common/SEOHelmet';
import { AivelloLogo } from '../common/AivelloLogo';
import { IconWrapper } from '../common/IconWrapper';
import { seoData } from '../../data/seoData';
import { tools } from '../../data/tools';

const GITHUB_URL = 'https://github.com/Raguvaasan/aivello';
const CONTACT_EMAIL = 'support@aivello.com';

const footerToolIds = ['pdf-to-word', 'image-compressor', 'resume-builder', 'qr-generator', 'grammar-checker'];
const footerTools = footerToolIds
  .map((id) => tools.find((tool) => tool.id === id))
  .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

// The footer is dark in both themes on purpose. gray-300 on gray-900 is ~12:1.
const footerLink =
  'inline-flex min-h-[44px] items-center rounded text-sm text-gray-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400';
const iconLink =
  'inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400';

const FooterColumn: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
    <ul>{children}</ul>
  </div>
);

export const LandingPage: React.FC = () => {
  const { hash } = useLocation();

  // Arriving from another page via "/#features" is a fresh load, and the section may
  // not exist yet when the browser tries to scroll to the fragment. Do it once rendered.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <SEOHelmet
        title={seoData.homepage.title}
        description={seoData.homepage.description}
        keywords={seoData.homepage.keywords}
        url="https://aivello.vercel.app/"
        structuredData={seoData.homepage.structuredData}
      />
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          <Hero />
          <Features />
        </main>

        <footer className="border-t border-white/10 bg-gray-900 text-gray-300">
          <div className="container mx-auto px-4 py-14 sm:px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
              <div className="col-span-2">
                <Link
                  to="/"
                  aria-label="Aivello home"
                  className="mb-4 inline-flex rounded-lg text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <AivelloLogo height={36} title="" />
                </Link>
                <p className="mb-6 max-w-md leading-relaxed text-gray-300">
                  {tools.length} free online tools for documents, images, writing and more. No signup, and most tools
                  run entirely in your browser.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Aivello on GitHub (opens in a new tab)"
                    className={iconLink}
                  >
                    <IconWrapper icon={FiGithub} className="h-5 w-5" />
                  </a>
                  <a href={`mailto:${CONTACT_EMAIL}`} aria-label={`Email ${CONTACT_EMAIL}`} className={iconLink}>
                    <IconWrapper icon={FiMail} className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <FooterColumn title="Product">
                <li>
                  <Link to="/app" className={footerLink}>
                    All tools
                  </Link>
                </li>
                <li>
                  <a href="#features" className={footerLink}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#categories" className={footerLink}>
                    Categories
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className={footerLink}>
                    Pricing
                  </Link>
                </li>
              </FooterColumn>

              <FooterColumn title="Popular">
                {footerTools.map((tool) => (
                  <li key={tool.id}>
                    <Link to={tool.path} className={footerLink}>
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </FooterColumn>

              <FooterColumn title="About">
                <li>
                  <Link to="/privacy" className={footerLink}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={footerLink}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={footerLink}>
                    Source code
                  </a>
                </li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className={footerLink}>
                    Contact
                  </a>
                </li>
              </FooterColumn>
            </div>

            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-sm text-gray-300 md:flex-row">
              <p className="flex flex-wrap items-center justify-center gap-1.5 text-center">
                &copy; {new Date().getFullYear()} Aivello. Made with
                <IconWrapper icon={FiHeart} className="h-4 w-4 text-pink-400" />
                <span className="sr-only">love</span>
                by Raguvaasan.
              </p>
              <p>All tools free, forever.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
