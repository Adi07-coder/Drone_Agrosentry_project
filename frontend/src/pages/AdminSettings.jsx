import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { containerVariants, itemVariants } from '../animations/variants';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';

const AdminSettings = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">System Settings</h2>
        <p className="text-slate-400">Configure system preferences and options</p>
      </motion.div>

      <div className="space-y-6 max-w-2xl">
        {/* System Configuration */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-emerald-400" />
              System Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  defaultValue="PlantAI"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Endpoint
                </label>
                <input
                  type="text"
                  defaultValue="https://api.plantai.com"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Feature Toggles</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Image Upload Detection</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Symptom Analysis</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Live Camera Detection</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Analytics Dashboard</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
