import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, ShoppingBag, Check, Lock } from 'lucide-react';
import { useGetCoinBalance } from '../hooks/useQueries';
import { toast } from 'sonner';

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
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Locked
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Buy
                      </>
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <CardTitle>Reward Shop</CardTitle>
            </div>
            <Badge variant="secondary" className="text-base">
              <Coins className="mr-1 h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              {currentCoins} coins
            </Badge>
          </div>
          <CardDescription>Spend your coins on cosmetic items and customizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="avatar" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="avatar">Avatar Frames</TabsTrigger>
              <TabsTrigger value="badge">Profile Badges</TabsTrigger>
              <TabsTrigger value="theme">Theme Colors</TabsTrigger>
            </TabsList>
            <TabsContent value="avatar" className="mt-6">
              {renderItems('avatar')}
            </TabsContent>
            <TabsContent value="badge" className="mt-6">
              {renderItems('badge')}
            </TabsContent>
            <TabsContent value="theme" className="mt-6">
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
            <div className="py-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <span className="text-4xl">{selectedItem.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold">{selectedItem.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <span className="font-bold">{selectedItem.price} coins</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">
                  After purchase: <span className="font-medium">{currentCoins - selectedItem.price} coins remaining</span>
                </p>
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
    </>
  );
}
