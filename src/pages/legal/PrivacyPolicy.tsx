import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
          
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <p>We collect information to provide better services to all our users. This includes information you provide, such as your name, email address, and usage data.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Information</h2>
              <p>We use the information we collect to provide, maintain, protect and improve our services, and to develop new ones.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
              <p>We do not share personal information with companies, organizations and individuals outside of Aivello unless one of the following circumstances applies:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>With your consent</li>
                <li>For external processing with our trusted partners</li>
                <li>For legal reasons</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Security</h2>
              <p>We work hard to protect Aivello and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Changes to This Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <Link to="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
