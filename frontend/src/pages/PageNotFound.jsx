import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { AlertTriangle, Home } from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-md"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <AlertTriangle className="w-20 h-20 mx-auto text-red-400 mb-4" />
          <h1 className="text-5xl font-bold mb-2">404</h1>
          <p className="text-slate-400 text-lg">Page Not Found</p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-6 bg-slate-900/50">
            <p className="text-slate-300 mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-sm text-slate-500">
              Please check the URL and try again, or go back to the dashboard.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/">
            <Button className="flex items-center gap-2 justify-center w-full">
              <Home className="w-4 h-4" />
              Go to Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PageNotFound;
