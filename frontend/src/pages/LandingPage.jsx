import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, CloudArrowUpIcon, DocumentDuplicateIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const LandingPage = () => {
  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Blockchain Security',
      description: 'Files are hashed and verified on the Ethereum blockchain for tamper-proof integrity',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: LockClosedIcon,
      title: 'AES-256 Encryption',
      description: 'End-to-end encryption ensures your files remain private and secure',
      color: 'from-purple-500 to-pink-500'
    },
    
    {
      icon: UserGroupIcon,
      title: 'Secure Sharing',
      description: 'Share files with granular access controls (view/download)',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: DocumentDuplicateIcon,
      title: 'Integrity Verification',
      description: 'Verify file authenticity anytime using blockchain records',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        {/* Subtle dots pattern overlay - simpler and safe */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 py-4 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Blockchain-Based FileSharing System
            </span>
          </div>
          <div className="flex space-x-4">
            <Link to="/login" className="btn-secondary px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary px-4 py-2">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-20 px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Blockchain-Based Filesharing System
            </span>
            <br />
            <span className="text-white"> File Sharing System</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Secure, transparent, and tamper-proof file sharing powered by blockchain technology. 
            Upload, share, and verify files with military-grade encryption.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-lg">
              Get Started Free
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 text-lg">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-blue-400">99.9%</div>
              <div className="text-white/70 mt-1">Data Integrity</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-purple-400">AES-256</div>
              <div className="text-white/70 mt-1">Encryption Standard</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400">Ethereum</div>
              <div className="text-white/70 mt-1">Blockchain Network</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-4 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Why Choose <span className="gradient-text">BlockShare</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="glass-card p-6 hover:scale-105 transition-transform duration-300">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} inline-block mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-4 max-w-4xl mx-auto text-center">
          <div className="glass-card p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Secure Your Files?
            </h2>
            <p className="text-white/70 mb-8">
              Join thousands of users who trust Blockchain-Based Filesharing System for their secure file sharing needs.
            </p>
            <Link to="/register" className="btn-primary px-8 py-3 text-lg inline-block">
              Start Now — It's Free
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 text-center text-white/40 text-sm border-t border-white/10 max-w-7xl mx-auto">
          <p>&copy; 2026 Blockchain-Based Cloud File Sharing System</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;