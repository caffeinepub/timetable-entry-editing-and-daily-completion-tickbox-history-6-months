import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Camera, Coins, Flame, Edit, Snowflake, TrendingUp, AlertCircle } from 'lucide-react';
import { useGetCallerUserProfile, useUpdateCallerProfile, useChangeDisplayName, useGetCoinBalance, useGetStudyStreak, useGetCurrentAndNextLevelStage, useGetAvailableStreakFreezes, usePurchaseNextLevelStage } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { WeeklyStudyTimeGraph } from './WeeklyStudyTimeGraph';
import { getBackendErrorMessage } from '../utils/backendErrorMessage';
import { normalizeRank } from '../utils/levelRanks';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProfileSection() {
  const { data: profile, refetch: refetchProfile } = useGetCallerUserProfile();
  const { data: coinBalance } = useGetCoinBalance();
  const { data: studyStreak } = useGetStudyStreak();
  const { data: levelStatus } = useGetCurrentAndNextLevelStage();
  const { data: availableFreezes } = useGetAvailableStreakFreezes();
  const updateProfile = useUpdateCallerProfile();
  const changeName = useChangeDisplayName();
  const purchaseNextLevel = usePurchaseNextLevelStage();

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const [showLevelUpgradeDialog, setShowLevelUpgradeDialog] = useState(false);

  const currentCoins = coinBalance ? Number(coinBalance) : 0;
  const currentStreak = studyStreak ? Number(studyStreak) : 0;
  const freezeCount = availableFreezes ? Number(availableFreezes) : 0;

  const handleBioEdit = () => {
    setNewBio(profile?.bio || '');
    setIsEditingBio(true);
  };

  const handleBioSave = async () => {
    try {
      await updateProfile.mutateAsync({
        profileImage: profile?.profileImage || null,
        bio: newBio,
      });
      setIsEditingBio(false);
      toast.success('Bio updated successfully');
    } catch (error) {
      const errorMessage = getBackendErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);

      await updateProfile.mutateAsync({
        profileImage: blob,
        bio: profile?.bio || '',
      });

      setImageKey((prev) => prev + 1);
      await refetchProfile();
      toast.success('Profile image updated successfully');
    } catch (error) {
      const errorMessage = getBackendErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await updateProfile.mutateAsync({
        profileImage: null,
        bio: profile?.bio || '',
      });

      setImageKey((prev) => prev + 1);
      await refetchProfile();
      toast.success('Profile image removed successfully');
    } catch (error) {
      const errorMessage = getBackendErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const handleNameEdit = () => {
    setNewName(profile?.name || '');
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      await changeName.mutateAsync(newName.trim());
      setIsEditingName(false);
      toast.success('Name updated successfully');
    } catch (error) {
      const errorMessage = getBackendErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const handleLevelUpgrade = async () => {
    try {
      await purchaseNextLevel.mutateAsync();
      setShowLevelUpgradeDialog(false);
      toast.success('Level upgraded successfully! 🎉');
    } catch (error) {
      const errorMessage = getBackendErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const nameChangeCost = profile?.nameChangeCount === BigInt(0) ? 0 : 50;

  // Normalize the current rank display
  const currentRank = levelStatus?.currentStage.rank ? normalizeRank(levelStatus.currentStage.rank) : 'Noob';
  const nextRank = levelStatus?.nextStage.rank ? normalizeRank(levelStatus.nextStage.rank) : 'Beginner 📈';
  const upgradeCost = levelStatus?.nextStage.requiredCoins ? Number(levelStatus.nextStage.requiredCoins) : 50;
  const hasEnoughCoins = levelStatus?.hasEnoughCoins ?? false;
  const currentLevel = levelStatus?.currentStage.level ? Number(levelStatus.currentStage.level) : 1;
  const nextLevel = levelStatus?.nextStage.level ? Number(levelStatus.nextStage.level) : 1;

  // Check if max level reached (Level 50 - Sigma Student 🗿)
  const isMaxLevel = currentLevel === 50 && currentRank === 'Sigma Student 🗿';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Manage your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar key={imageKey} className="h-32 w-32">
                {profile?.profileImage ? (
                  <AvatarImage src={profile.profileImage.getDirectURL()} alt={profile.name} />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {profile?.name ? getInitials(profile.name) : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={isUploadingImage} asChild>
                  <label className="cursor-pointer">
                    <Camera className="mr-2 h-4 w-4" />
                    {isUploadingImage ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </Button>
                {profile?.profileImage && (
                  <Button variant="outline" size="sm" onClick={handleRemoveImage}>
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="flex gap-2">
                  <Input value={profile?.name || ''} disabled className="flex-1" />
                  <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleNameEdit}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Display Name</DialogTitle>
                        <DialogDescription>
                          {nameChangeCost === 0
                            ? 'First name change is free'
                            : `Changing your name costs ${nameChangeCost} coins`}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-name">New Name</Label>
                          <Input
                            id="new-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter your new name"
                          />
                        </div>
                        {nameChangeCost > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                            <span>
                              Current balance: {currentCoins} coins
                              {currentCoins < nameChangeCost && ' (Insufficient coins)'}
                            </span>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditingName(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleNameSave}
                          disabled={changeName.isPending || (nameChangeCost > 0 && currentCoins < nameChangeCost)}
                        >
                          {changeName.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                {isEditingBio ? (
                  <div className="space-y-2">
                    <Textarea
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleBioSave} disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingBio(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Textarea value={profile?.bio || ''} disabled rows={3} className="flex-1" />
                    <Button variant="outline" size="sm" onClick={handleBioEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coin Balance</p>
                    <p className="text-2xl font-bold">{currentCoins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                    <p className="text-2xl font-bold">{currentStreak} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Streak Freezes</p>
                    <p className="text-2xl font-bold">{freezeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Level</p>
                    <p className="text-lg font-bold">{currentRank}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Level Upgrade Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Level Progress</CardTitle>
          </div>
          <CardDescription>Upgrade your level to unlock new ranks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="text-xl font-bold">Level {currentLevel}</p>
                  <p className="text-lg">{currentRank}</p>
                </div>
                {!isMaxLevel && (
                  <>
                    <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30 mx-4" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Next</p>
                      <p className="text-xl font-bold">Level {nextLevel}</p>
                      <p className="text-lg">{nextRank}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              {isMaxLevel ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You've reached the maximum level!
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Upgrade Cost:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <span>{upgradeCost}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your Balance:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <span>{currentCoins}</span>
                    </div>
                  </div>
                  <Dialog open={showLevelUpgradeDialog} onOpenChange={setShowLevelUpgradeDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full mt-2"
                        disabled={!hasEnoughCoins}
                      >
                        {hasEnoughCoins ? 'Upgrade Level' : 'Insufficient Coins'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upgrade Level</DialogTitle>
                        <DialogDescription>
                          Confirm your level upgrade to {nextRank}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">From</p>
                            <p className="font-bold">Level {currentLevel} - {currentRank}</p>
                          </div>
                          <div className="text-2xl">→</div>
                          <div>
                            <p className="text-sm text-muted-foreground">To</p>
                            <p className="font-bold">Level {nextLevel} - {nextRank}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <span className="font-medium">Cost:</span>
                          <div className="flex items-center gap-1 font-bold text-lg">
                            <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                            <span>{upgradeCost}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLevelUpgradeDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleLevelUpgrade}
                          disabled={purchaseNextLevel.isPending}
                        >
                          {purchaseNextLevel.isPending ? 'Upgrading...' : 'Confirm Upgrade'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <WeeklyStudyTimeGraph />
    </div>
  );
}
