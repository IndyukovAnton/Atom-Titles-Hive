import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Folder, Search, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: <Plus className="w-12 h-12 text-primary" />,
    title: 'Создание записей',
    description: 'Добавляйте медиа-контент быстро и легко',
    details: [
      'Нажмите кнопку "+" для создания новой записи',
      'Заполните информацию: название, категорию, рейтинг',
      'Добавьте теги и описание для лучшей организации',
      'Привяжите обложку или другие медиафайлы',
    ],
  },
  {
    icon: <Folder className="w-12 h-12 text-primary" />,
    title: 'Организация в папки',
    description: 'Структурируйте свою коллекцию',
    details: [
      'Создавайте группы и подгруппы',
      'Перетаскивайте записи между группами',
      'Используйте вложенные папки для иерархии',
      'Настраивайте цвета и иконки групп',
    ],
  },
  {
    icon: <Search className="w-12 h-12 text-primary" />,
    title: 'Поиск и фильтры',
    description: 'Находите нужный контент мгновенно',
    details: [
      'Используйте строку поиска для быстрого доступа',
      'Фильтруйте по категориям, рейтингу и датам',
      'Применяйте расширенные фильтры',
      'Сохраняйте часто используемые запросы',
    ],
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateProfile } = useAuthStore();

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await updateProfile({ hasCompletedOnboarding: true });
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      onComplete(); // Даже при ошибке закрываем онбординг
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile({ hasCompletedOnboarding: true });
      onSkip();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      onSkip();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl"
      >
        <Card className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
                <CardDescription>
                  Шаг {currentStep + 1} из {ONBOARDING_STEPS.length}
                </CardDescription>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground text-lg">{step.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {step.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 text-left"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{detail}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={currentStep === 0 ? handleSkip : handlePrevious}
              >
                {currentStep === 0 ? 'Пропустить' : 'Назад'}
              </Button>

              <div className="flex items-center gap-2">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-primary w-8'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Завершить' : 'Далее'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
