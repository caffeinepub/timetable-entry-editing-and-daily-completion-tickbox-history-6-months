import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, ShoppingBag, Check, Lock, Award } from 'lucide-react';
import { useGetCoinBalance, useGetStreakMilestoneRewards } from '../hooks/useQueries';
import { toast } from 'sonner';
import { LEVEL_RANKS } from '../utils/levelRanks';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'avatar' | 'badge' | 'theme';
  icon: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Avatar Frames
  {
    id: 'avatar-gold',
    name: 'Gold Frame',
    description: 'Elegant gold avatar frame',
    price: 100,
    category: 'avatar',
    icon: '🟡',
  },
  {
    id: 'avatar-silver',
    name: 'Silver Frame',
    description: 'Sleek silver avatar frame',
    price: 75,
    category: 'avatar',
    icon: '⚪',
  },
  {
    id: 'avatar-bronze',
    name: 'Bronze Frame',
    description: 'Classic bronze avatar frame',
    price: 50,
    category: 'avatar',
    icon: '🟤',
  },
  
  // Profile Badges
  {
    id: 'badge-star',
    name: 'Star Scholar',
    description: 'Show off your dedication',
    price: 150,
    category: 'badge',
    icon: '⭐',
  },
  {
    id: 'badge-fire',
    name: 'Fire Streak',
    description: 'For the consistent studier',
    price: 200,
    category: 'badge',
    icon: '🔥',
  },
  {
    id: 'badge-trophy',
    name: 'Trophy Master',
    description: 'Achievement unlocked',
    price: 250,
    category: 'badge',
    icon: '🏆',
  },
  
  // Theme Colors
  {
    id: 'theme-purple',
    name: 'Purple Theme',
    description: 'Royal purple color scheme',
    price: 120,
    category: 'theme',
    icon: '🟣',
  },
  {
    id: 'theme-blue',
    name: 'Ocean Blue',
    description: 'Calm ocean blue theme',
    price: 120,
    category: 'theme',
    icon: '🔵',
  },
  {
    id: 'theme-green',
    name: 'Forest Green',
    description: 'Natural forest green theme',
    price: 120,
    category: 'theme',
    icon: '🟢',
  },
];

export function RewardShopSection() {
  const { data: coinBalance } = useGetCoinBalance();
  const { data: milestoneRewards } = useGetStreakMilestoneRewards();
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const currentCoins = coinBalance ? Number(coinBalance) : 0;

  const handlePurchaseClick = (item: ShopItem) => {
    if (ownedItems.has(item.id)) {
      toast.info('You already own this item');
      return;
    }

    if (currentCoins < item.price) {
      toast.error(`Insufficient coins. You need ${item.price - currentCoins} more coins.`);
      return;
    }

    setSelectedItem(item);
    setShowPurchaseDialog(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedItem) return;

    // Simulate purchase (in real app, this would call backend)
    setOwnedItems(prev => new Set([...prev, selectedItem.id]));
    toast.success(`${selectedItem.name} purchased successfully!`);
    setShowPurchaseDialog(false);
    setSelectedItem(null);
  };

  const isOwned = (itemId: string) => ownedItems.has(itemId);

  const renderItems = (category: ShopItem['category']) => {
    const items = SHOP_ITEMS.filter(item => item.category === category);

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const owned = isOwned(item.id);
          const canAfford = currentCoins >= item.price;

          return (
            <Card key={item.id} className={owned ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription className="text-xs">{item.description}</CardDescription>
                    </div>
                  </div>
                  {owned && (
                    <Badge variant="default" className="ml-2">
                      <Check className="h-3 w-3 mr-1" />
                      Owned
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <span className="font-bold">{item.price}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchaseClick(item)}
                    disabled={owned || !canAfford}
                    variant={owned ? 'secondary' : 'default'}
                  >
                    {owned ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Owned
                      </>
                    ) : !canAfford ? (
                      'Not Enough Coins'
                    ) : (
                      'Purchase'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const scholarGoldUnlocked = milestoneRewards?.hasScholarGoldBadge ?? false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <CardTitle>Reward Shop</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <span className="text-lg font-bold">{currentCoins}</span>
            </div>
          </div>
          <CardDescription>Spend your coins on exclusive rewards and customizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ranks" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ranks">Ranks</TabsTrigger>
              <TabsTrigger value="avatar">Avatar Frames</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="themes">Themes</TabsTrigger>
            </TabsList>

            <TabsContent value="ranks" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Level Ranks</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Progress through these ranks by upgrading your level in the Profile section.
                </p>
                <div className="space-y-3">
                  {LEVEL_RANKS.map((rank, index) => (
                    <Card key={rank}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{rank}</p>
                              <p className="text-sm text-muted-foreground">
                                {index === 0 && 'Starting rank'}
                                {index === 1 && 'First upgrade'}
                                {index === 2 && 'Intermediate level'}
                                {index === 3 && 'Advanced level'}
                                {index === 4 && 'Maximum rank'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="mt-6 border-2 border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                        <CardTitle>Scholar Gold Badge</CardTitle>
                      </div>
                      {scholarGoldUnlocked ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {scholarGoldUnlocked
                        ? 'Congratulations! You earned the Scholar Gold Badge!'
                        : 'Reach a 30-day study streak to unlock this exclusive badge'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center p-8 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                      <div className="text-6xl">🏆</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="mt-6">
              {renderItems('avatar')}
            </TabsContent>

            <TabsContent value="badges" className="mt-6">
              {renderItems('badge')}
            </TabsContent>

            <TabsContent value="themes" className="mt-6">
              {renderItems('theme')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase this item?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <span className="text-4xl">{selectedItem.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold">{selectedItem.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="font-medium">Price:</span>
                <div className="flex items-center gap-1 font-bold text-lg">
                  <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  <span>{selectedItem.price}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Your balance after purchase:</span>
                <div className="flex items-center gap-1 font-semibold">
                  <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <span>{currentCoins - selectedItem.price}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPurchase}>
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
