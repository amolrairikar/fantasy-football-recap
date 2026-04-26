import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyDialog({ open, onOpenChange }: PrivacyDialogProps) {
  const navigate = useNavigate();

  const handleViewFullPolicy = () => {
    onOpenChange(false);
    navigate('/privacy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            We collect league data from ESPN and Sleeper to provide analytics about your league history. Your data is stored securely and never sold.
          </p>
          <Button onClick={handleViewFullPolicy} className="w-full cursor-pointer">
            View Full Privacy Policy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
