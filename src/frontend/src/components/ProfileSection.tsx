import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Edit2, Upload, Flame } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateCallerProfile, useChangeDisplayName, useGetCoinBalance, useGetStudyStreak } from '../hooks/useQueries';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ExternalBlob as ExternalBlobClass } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export function ProfileSection() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const { data: coinBalance } = useGetCoinBalance();
  const { data: studyStreak } = useGetStudyStreak();
  const updateProfileMutation = useUpdateCallerProfile();
  const changeNameMutation = useChangeDisplayName();
  
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Please log in to view your profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Loading profile...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Profile not found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setBio('');
      setProfileImageUrl('');
    } else {
      setBio(profile.bio);
      setProfileImageUrl(profile.profileImage?.getDirectURL() || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      let imageBlob = profile.profileImage || null;
      
      if (profileImageUrl && profileImageUrl !== profile.profileImage?.getDirectURL()) {
        // New image uploaded
        const response = await fetch(profileImageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlobClass.fromBytes(uint8Array);
      }

      await updateProfileMutation.mutateAsync({
        profileImage: imageBlob,
        bio,
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNameChange = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    const nameCost = Number(profile.nameChangeCount) === 0 ? 0 : 50;
    const currentCoins = coinBalance ? Number(coinBalance) : Number(profile.coins);

    if (currentCoins < nameCost) {
      toast.error(`Insufficient coins. You need ${nameCost} coins to change your name.`);
      return;
    }

    try {
      await changeNameMutation.mutateAsync(newName);
      toast.success(nameCost === 0 ? 'Name set successfully!' : `Name changed! ${nameCost} coins deducted.`);
      setShowNameDialog(false);
      setNewName('');
    } catch (error) {
      toast.error('Failed to change name');
    }
  };

  const nameCost = Number(profile.nameChangeCount) === 0 ? 0 : 50;
  const currentCoins = coinBalance ? Number(coinBalance) : Number(profile.coins);
  const currentStreak = studyStreak ? Number(studyStreak) : 0;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={isEditing ? profileImageUrl : profile.profileImage?.getDirectURL()} 
                  alt={profile.name} 
                />
                <AvatarFallback className="text-3xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold">{profile.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewName(profile.name);
                    setShowNameDialog(true);
                  }}
                  className="mt-1"
                >
                  <Edit2 className="mr-1 h-3 w-3" />
                  Change Name {nameCost > 0 && `(${nameCost} coins)`}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
                    <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium">Total Coins</span>
                </div>
                <Badge variant="secondary" className="text-base font-bold">
                  {currentCoins}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-500/10 to-red-600/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  </div>
                  <span className="text-sm font-medium">Study Streak</span>
                </div>
                <Badge variant="secondary" className="text-base font-bold">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </Badge>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name Changes</span>
                  <span className="font-medium">{Number(profile.nameChangeCount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Motivational Bio</CardTitle>
                <CardDescription>Share your study motivation and goals</CardDescription>
              </div>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={isEditing ? handleSaveProfile : handleEditToggle}
                disabled={updateProfileMutation.isPending}
              >
                {isEditing ? (
                  updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="bio">Your Motivational Quote</Label>
                <Textarea
                  id="bio"
                  placeholder="Enter your motivational quote or study goals..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Share what motivates you to study and achieve your goals
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/50 p-6">
                {profile.bio ? (
                  <blockquote className="border-l-4 border-primary pl-4 italic">
                    <p className="text-lg">{profile.bio}</p>
                  </blockquote>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No motivational quote set yet. Click "Edit Profile" to add one!
                  </p>
                )}
              </div>
            )}

            {isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Display Name</DialogTitle>
            <DialogDescription>
              {nameCost === 0 
                ? 'Set your display name for free (first time only)'
                : `Changing your name costs ${nameCost} coins. You have ${currentCoins} coins.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">New Display Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your new name"
              />
            </div>
            {nameCost > 0 && currentCoins < nameCost && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                Insufficient coins. You need {nameCost - currentCoins} more coins.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleNameChange}
              disabled={changeNameMutation.isPending || (nameCost > 0 && currentCoins < nameCost)}
            >
              {changeNameMutation.isPending ? 'Changing...' : nameCost === 0 ? 'Set Name' : `Change Name (${nameCost} coins)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
