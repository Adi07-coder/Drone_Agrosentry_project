import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import {
  Leaf,
  Upload,
  Stethoscope,
  Video,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { containerVariants, itemVariants, floatingVariants } from '../animations/variants';

const Landing = () => {
  const features = [
    {
      icon: Upload,
      title: 'Image Upload Detection',
      description: 'Upload plant photos for instant AI-powered disease detection',
    },
    {
      icon: Stethoscope,
      title: 'Symptom Analysis',
      description: 'Describe symptoms and get detailed diagnosis recommendations',
    },
    {
      icon: Video,
      title: 'Live Camera Scanning',
      description: 'Real-time disease detection directly from your camera',
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Track plant health and disease trends over time',
    },
    {
      icon: Shield,
      title: 'Expert Recommendations',
      description: 'Get treatment and prevention advice from agriculture experts',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get analysis results in seconds with 95%+ accuracy',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              {/* Badge */}
              <motion.div variants={itemVariants} className="mb-6 flex justify-center">
                <div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 inline-flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">AI-Powered Agriculture</span>
                </div>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-400 bg-clip-text text-transparent"
              >
                AI Powered Plant Disease Detection System
              </motion.h1>

              {/* Subheading */}
              <motion.p
                variants={itemVariants}
                className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto"
              >
                Detect plant diseases using image analysis, symptom analysis, and live camera monitoring.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/login">
                  <Button size="lg" className="px-8">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>

              {/* Hero Image/Placeholder */}
              <motion.div
                variants={itemVariants}
                className="relative"
              >
                <motion.div
                  animate={floatingVariants.animate}
                  className="relative w-full h-96 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-lime-400/20 border border-emerald-500/30 overflow-hidden flex items-center justify-center"
                >
                  <Leaf className="w-32 h-32 text-emerald-500/50 animate-pulse" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-slate-400">Everything you need to protect your plants</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} variants={itemVariants}>
                    <Card className="h-full p-6 text-center">
                      <Icon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-slate-400">{feature.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Login Cards Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Quick Access</h2>
              <p className="text-xl text-slate-400">Choose your role to get started</p>
            </motion.div>

            <div className="flex justify-center max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="w-full sm:w-1/2"
              >
                <Link to="/login">
                  <Card className="p-8 text-center hover:shadow-xl hover:shadow-emerald-500/30">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <Leaf className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Login / Sign up</h3>
                    <p className="text-slate-400 mb-6">Access your dashboard and start detecting diseases</p>
                    <Button variant="secondary" className="w-full">
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold">PlantAI</span>
                </div>
                <p className="text-slate-400">Advanced AI-powered plant disease detection</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition">Features</a></li>
                  <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition">About</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Follow</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition"><Mail size={20} /></a>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition"><Mail size={20} /></a>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition"><Mail size={20} /></a>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex justify-between items-center text-slate-400">
              <p>&copy; 2024 PlantAI. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition">Privacy</a>
                <a href="#" className="hover:text-white transition">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
