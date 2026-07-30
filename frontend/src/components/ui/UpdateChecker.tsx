import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { runInteractiveUpdateCheck } from '@/utils/updater';

interface UpdateCheckerProps {
  /** Override label shown next to the icon. Defaults to current app version. */
  label?: string;
  className?: string;
}

/**
 * Floating "check for updates" button. Used on auth screens so a broken build
 * can always self-recover via the updater without the user reaching Settings.
 */
export function UpdateChecker({ label, className }: UpdateCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async () => {
    setIsChecking(true);
    try {
      await runInteractiveUpdateCheck();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isChecking}
      className={className}
      title="Проверить обновления"
    >
      {isChecking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-2 text-xs">{label ?? `v${__APP_VERSION__}`}</span>
    </Button>
  );
}
