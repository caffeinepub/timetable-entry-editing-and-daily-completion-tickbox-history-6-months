import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Edit2, Upload, Flame, TrendingUp, Lock, Unlock, Trash2 } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateCallerProfile, useChangeDisplayName, useGetStudyStreak, useGetCurrentAndNextLevelStage, usePurchaseNextLevelStage } from '../hooks/useQueries';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ExternalBlob as ExternalBlobClass } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { mapBackendError } from '../utils/backendErrorMessage';
import { WeeklyStudyTimeGraph } from './WeeklyStudyTimeGraph';

export function ProfileSection() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const { data: studyStreak } = useGetStudyStreak();
  const { data: levelStatus, isLoading: levelLoading } = useGetCurrentAndNextLevelStage();
  const updateProfileMutation = useUpdateCallerProfile();
  const changeNameMutation = useChangeDisplayName();
  const purchaseLevelMutation = usePurchaseNextLevelStage();
  
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showRemovePhotoDialog, setShowRemovePhotoDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!identity;

  // Cleanup preview URL on unmount or when canceling
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      // Cancel editing - cleanup
      setBio('');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    } else {
      // Start editing
      setBio(profile.bio);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      let imageBlob = profile.profileImage || null;
      
      if (selectedFile) {
        // Convert file to bytes and upload
        const arrayBuffer = await selectedFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlobClass.fromBytes(uint8Array);
      }

      await updateProfileMutation.mutateAsync({
        profileImage: imageBlob,
        bio,
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        profileImage: null,
        bio: profile.bio,
      });

      toast.success('Profile photo removed successfully!');
      setShowRemovePhotoDialog(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Cleanup old preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedFile(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNameChange = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    const nameCost = Number(profile.nameChangeCount) === 0 ? 0 : 50;
    const currentCoins = Number(profile.coins);

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
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleLevelUpgrade = async () => {
    if (!levelStatus) return;

    try {
      const result = await purchaseLevelMutation.mutateAsync();
      toast.success(`Level upgraded to ${result.currentStage.displayText}!`);
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const nameCost = Number(profile.nameChangeCount) === 0 ? 0 : 50;
  const currentCoins = Number(profile.coins);
  const currentStreak = studyStreak ? Number(studyStreak) : 0;

  // Detect max level: Level 50 - Sigma Student 🗿
  const isMaxLevel = levelStatus && 
    Number(levelStatus.currentStage.level) === 50 && 
    levelStatus.currentStage.rank === 'Sigma Student 🗿';
  
  const canAffordUpgrade = levelStatus && levelStatus.hasEnoughCoins;

  // Determine which image to show
  const getAvatarSrc = () => {
    if (isEditing && previewUrl) {
      return previewUrl;
    }
    return profile.profileImage?.getDirectURL() || '';
  };

  const avatarSrc = getAvatarSrc();
  const hasProfileImage = profile.profileImage || selectedFile;

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
                {avatarSrc && <AvatarImage src={avatarSrc} alt={profile.name} />}
                <AvatarFallback className="text-3xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="flex flex-col gap-2 w-full items-center">
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
                  
                  {hasProfileImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRemovePhotoDialog(true)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Photo
                    </Button>
                  )}
                </div>
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

      {/* Level System Card */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Level Progression</CardTitle>
          </div>
          <CardDescription>Unlock new levels by spending coins</CardDescription>
        </CardHeader>
        <CardContent>
          {levelLoading ? (
            <div className="text-center text-muted-foreground">Loading level status...</div>
          ) : levelStatus ? (
            <div className="space-y-6">
              {/* Current Level */}
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Unlock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Level</p>
                      <p className="text-2xl font-bold">{levelStatus.currentStage.displayText}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    Unlocked
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Next Level or Max Level */}
              {!isMaxLevel ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Next Level</p>
                          <p className="text-2xl font-bold">{levelStatus.nextStage.displayText}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <div className="flex items-center gap-1">
                          <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                          <span className="text-xl font-bold">{Number(levelStatus.nextStage.requiredCoins)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleLevelUpgrade}
                      disabled={!canAffordUpgrade || purchaseLevelMutation.isPending}
                    >
                      {purchaseLevelMutation.isPending ? (
                        'Upgrading...'
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-5 w-5" />
                          Upgrade to {levelStatus.nextStage.displayText}
                        </>
                      )}
                    </Button>
                    
                    {!canAffordUpgrade && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                        Insufficient coins. You need {Number(levelStatus.nextStage.requiredCoins) - Number(levelStatus.userCoins)} more coins to upgrade.
                      </div>
                    )}
                  </div>

                  {/* Progress Info */}
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your Coins</span>
                      <span className="font-bold">{Number(levelStatus.userCoins)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Maximum Level Reached!</h3>
                      <p className="mt-2 text-muted-foreground">
                        Congratulations! You've reached the highest level possible.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Unable to load level status</div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Study Time Graph */}
      <WeeklyStudyTimeGraph />

      {/* Name Change Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Display Name</DialogTitle>
            <DialogDescription>
              {nameCost === 0
                ? 'First name change is free!'
                : `Changing your name costs ${nameCost} coins.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">New Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleNameChange}
              disabled={changeNameMutation.isPending || !newName.trim()}
            >
              {changeNameMutation.isPending ? 'Changing...' : 'Change Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Photo Confirmation Dialog */}
      <AlertDialog open={showRemovePhotoDialog} onOpenChange={setShowRemovePhotoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePhoto}
              disabled={updateProfileMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateProfileMutation.isPending ? 'Removing...' : 'Remove Photo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
