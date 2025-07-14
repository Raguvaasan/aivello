import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>Welcome to Aivello. By using our service, you agree to these terms. Please read them carefully.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Using our Services</h2>
              <p>You must follow any policies made available to you within the Services. You may use our Services only as permitted by law. We may suspend or stop providing our Services to you if you do not comply with our terms or policies.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Privacy and Copyright Protection</h2>
              <p>Our <Link to="/privacy" className="text-blue-400 hover:text-blue-300">privacy policy</Link> explains how we treat your personal data and protect your privacy when you use our Services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Your Content in our Services</h2>
              <p>You retain ownership of any intellectual property rights that you hold in the content you submit or upload to our Services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Usage Limits</h2>
              <p>We may set limits on the use of our Services to protect our systems and ensure reliable service for all users.</p>
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

export default Terms;
