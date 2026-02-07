import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Wand2, Check, Coins, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob as ExternalBlobClass } from '../backend';
import { useCamera } from '../camera/useCamera';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetCoinBalance, useSpendCoinsForBackground, usePurchaseCustomBackground } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BackgroundSettingsProps {
  onBackgroundChange: (url: string) => void;
  currentBackground: string;
}

interface RarityTier {
  name: string;
  cost: number;
  gradient: string;
  icon: string;
  description: string;
}

const RARITY_TIERS: RarityTier[] = [
  {
    name: 'Normal',
    cost: 100,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '/assets/generated/normal-stone.dim_64x64.png',
    description: 'Simple and elegant',
  },
  {
    name: 'Common',
    cost: 150,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: '/assets/generated/common-medal.dim_64x64.png',
    description: 'Cool and refreshing',
  },
  {
    name: 'Rare',
    cost: 200,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: '/assets/generated/rare-crystal.dim_64x64.png',
    description: 'Vibrant and energetic',
  },
  {
    name: 'Legendary',
    cost: 300,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    icon: '/assets/generated/legendary-gem.dim_64x64.png',
    description: 'Stunning and powerful',
  },
  {
    name: 'Mythical',
    cost: 500,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: '/assets/generated/mythical-coin-stack.dim_64x64.png',
    description: 'Legendary and rare',
  },
];

const CUSTOM_BACKGROUND_COST = 200;

export function BackgroundSettings({ onBackgroundChange, currentBackground }: BackgroundSettingsProps) {
  const { data: coinBalance } = useGetCoinBalance();
  const spendCoinsMutation = useSpendCoinsForBackground();
  const purchaseCustomMutation = usePurchaseCustomBackground();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedBackgrounds, setUploadedBackgrounds] = useState<string[]>([]);
  
  const {
    isActive,
    isSupported,
    error,
    isLoading: cameraLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment' });

  const currentCoins = coinBalance ? Number(coinBalance) : 0;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check coin balance
    if (currentCoins < CUSTOM_BACKGROUND_COST) {
      toast.error(`Insufficient coins. You need ${CUSTOM_BACKGROUND_COST} coins to upload a custom background.`);
      return;
    }

    try {
      // Generate a unique ID for this background
      const backgroundId = `custom-upload-${Date.now()}`;
      
      // Purchase the background (deduct coins)
      const success = await purchaseCustomMutation.mutateAsync(backgroundId);
      
      if (!success) {
        toast.error('Insufficient coins for custom background upload');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setUploadedBackgrounds((prev) => [...prev, url]);
        onBackgroundChange(url);
        toast.success(`Background uploaded successfully! ${CUSTOM_BACKGROUND_COST} coins deducted.`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload background');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = async () => {
    // Check coin balance before capturing
    if (currentCoins < CUSTOM_BACKGROUND_COST) {
      toast.error(`Insufficient coins. You need ${CUSTOM_BACKGROUND_COST} coins to capture a custom background.`);
      return;
    }

    const photoFile = await capturePhoto();
    if (photoFile) {
      try {
        // Generate a unique ID for this background
        const backgroundId = `custom-photo-${Date.now()}`;
        
        // Purchase the background (deduct coins)
        const success = await purchaseCustomMutation.mutateAsync(backgroundId);
        
        if (!success) {
          toast.error('Insufficient coins for custom background capture');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          setUploadedBackgrounds((prev) => [...prev, url]);
          onBackgroundChange(url);
          toast.success(`Photo captured and set as background! ${CUSTOM_BACKGROUND_COST} coins deducted.`);
        };
        reader.readAsDataURL(photoFile);
        
        setShowCamera(false);
        stopCamera();
      } catch (error) {
        toast.error('Failed to capture photo');
      }
    }
  };

  const handleGenerateAIBackground = async (rarity: RarityTier) => {
    if (currentCoins < rarity.cost) {
      toast.error(`Insufficient coins. You need ${rarity.cost} coins to generate a ${rarity.name} background.`);
      return;
    }

    try {
      const success = await spendCoinsMutation.mutateAsync(rarity.name);
      
      if (success) {
        onBackgroundChange(rarity.gradient);
        toast.success(`${rarity.name} background generated! ${rarity.cost} coins deducted.`);
      } else {
        toast.error('Insufficient coins for this background');
      }
    } catch (error) {
      toast.error('Failed to generate background');
    }
  };

  const handleOpenCamera = async () => {
    if (currentCoins < CUSTOM_BACKGROUND_COST) {
      toast.error(`Insufficient coins. You need ${CUSTOM_BACKGROUND_COST} coins to take a photo.`);
      return;
    }
    setShowCamera(true);
    await startCamera();
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Background Settings</CardTitle>
                <CardDescription>Customize your app background</CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-4 py-2">
                <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <span className="text-lg font-bold">{currentCoins}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Custom Background ({CUSTOM_BACKGROUND_COST} coins)</Label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={currentCoins < CUSTOM_BACKGROUND_COST || purchaseCustomMutation.isPending}
                >
                  {currentCoins < CUSTOM_BACKGROUND_COST ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenCamera}
                  disabled={currentCoins < CUSTOM_BACKGROUND_COST || purchaseCustomMutation.isPending}
                >
                  {currentCoins < CUSTOM_BACKGROUND_COST ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Take Photo
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </>
                  )}
                </Button>
              </div>
              {currentCoins < CUSTOM_BACKGROUND_COST && (
                <p className="text-xs text-muted-foreground">
                  You need {CUSTOM_BACKGROUND_COST - currentCoins} more coins to upload custom backgrounds
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Default Background</Label>
              <button
                onClick={() => onBackgroundChange('')}
                className="group relative aspect-video w-full overflow-hidden rounded-lg border-2 bg-background transition-all hover:border-primary"
              >
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-background to-muted">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    Default Theme
                  </span>
                </div>
                {currentBackground === '' && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>

            {uploadedBackgrounds.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Your Uploaded Backgrounds</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedBackgrounds.map((bg, index) => (
                      <button
                        key={index}
                        onClick={() => onBackgroundChange(bg)}
                        className="group relative aspect-video overflow-hidden rounded-lg border-2 transition-all hover:border-primary"
                        style={{
                          backgroundImage: `url(${bg})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {currentBackground === bg && (
                          <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>AI-Generated Backgrounds</Label>
                <Badge variant="secondary" className="gap-1">
                  <Wand2 className="h-3 w-3" />
                  Premium
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {RARITY_TIERS.map((tier) => (
                  <button
                    key={tier.name}
                    onClick={() => handleGenerateAIBackground(tier)}
                    disabled={spendCoinsMutation.isPending}
                    className="group relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all hover:border-primary disabled:opacity-50"
                    style={{
                      background: tier.gradient,
                    }}
                  >
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <img src={tier.icon} alt={tier.name} className="h-8 w-8" />
                          <h4 className="font-bold text-white">{tier.name}</h4>
                        </div>
                        <p className="text-xs text-white/90">{tier.description}</p>
                        <div className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          <Coins className="h-3 w-3" />
                          {tier.cost}
                        </div>
                      </div>
                      {currentBackground === tier.gradient && (
                        <div className="rounded-full bg-white p-1">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/10" />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCamera} onOpenChange={(open) => {
        setShowCamera(open);
        if (!open) stopCamera();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Photo ({CUSTOM_BACKGROUND_COST} coins)</DialogTitle>
            <DialogDescription>
              Position your camera and capture a photo for your background
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </div>
            )}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ minHeight: '300px' }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCameraCapture}
                disabled={!isActive || cameraLoading}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                {cameraLoading ? 'Loading...' : 'Capture Photo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCamera(false);
                  stopCamera();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
