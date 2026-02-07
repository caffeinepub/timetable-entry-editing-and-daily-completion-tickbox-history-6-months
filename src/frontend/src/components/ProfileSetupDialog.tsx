import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInitializeProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

export function ProfileSetupDialog() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const initializeProfileMutation = useInitializeProfile();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await initializeProfileMutation.mutateAsync({
        name: name.trim(),
        bio: bio.trim(),
      });
      toast.success('🎉 Welcome! Your profile has been created with 500 coins!');
    } catch (error) {
      console.error('Profile initialization error:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to Exam Prep Hub!</DialogTitle>
          <DialogDescription className="text-center">
            Let's set up your profile to get started. You'll receive <strong>500 coins</strong> as a welcome bonus!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Motivational Quote (Optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What motivates you to study?"
              rows={3}
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            disabled={initializeProfileMutation.isPending || !name.trim()}
            className="w-full"
            size="lg"
          >
            {initializeProfileMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                Creating Profile...
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
