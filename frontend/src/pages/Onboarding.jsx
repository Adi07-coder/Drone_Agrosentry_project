import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mockOnboardingSteps } from '../data/mockData';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { containerVariants, itemVariants } from '../animations/variants';
import * as Icons from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(0);

  const currentStepData = mockOnboardingSteps[currentStep];
  const Icon = Icons[currentStepData.icon];

  const handleNext = () => {
    if (currentStep < mockOnboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-3xl"
      >
        {/* Progress Bar */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex gap-2">
            {mockOnboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                animate={{
                  scaleX: index === currentStep ? 1 : 0.5,
                  backgroundColor: index <= currentStep ? '#22c55e' : '#475569',
                }}
                className="flex-1 h-1 rounded-full origin-left"
              />
            ))}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-12 text-center">
            {/* Step Number */}
            <div className="text-sm font-semibold text-emerald-400 mb-4">
              Step {currentStep + 1} of {mockOnboardingSteps.length}
            </div>

            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-lime-400/30 flex items-center justify-center mx-auto">
                <Icon className="w-10 h-10 text-emerald-400" />
              </div>
            </motion.div>

            {/* Title & Description */}
            <h1 className="text-4xl font-bold text-white mb-4">{currentStepData.title}</h1>
            <p className="text-xl text-slate-400 mb-12">{currentStepData.description}</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleNext} size="lg" className="flex-1">
                {currentStep === mockOnboardingSteps.length - 1 ? 'Go To Dashboard' : 'Next'}
              </Button>
              <Button onClick={handleSkip} variant="ghost" size="lg">
                Skip Tutorial
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Step Info Cards */}
        <motion.div
          variants={itemVariants}
          className="mt-12 grid md:grid-cols-5 gap-4"
        >
          {mockOnboardingSteps.map((step, index) => {
            const StepIcon = Icons[step.icon];
            return (
              <motion.div
                key={step.step}
                animate={{
                  scale: index === currentStep ? 1.05 : 1,
                  opacity: index <= currentStep ? 1 : 0.5,
                }}
              >
                <Card
                  className={`p-4 cursor-pointer text-center ${index === currentStep ? 'ring-2 ring-emerald-500' : ''}`}
                  onClick={() => setCurrentStep(index)}
                >
                  <StepIcon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
