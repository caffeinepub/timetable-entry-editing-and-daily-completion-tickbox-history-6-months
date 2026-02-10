import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [avatarKey, setAvatarKey] = useState(0);

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  // Force avatar refresh when profile image changes
  useEffect(() => {
    if (profile?.profileImage) {
      setAvatarKey(prev => prev + 1);
    }
  }, [profile?.profileImage]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const avatarSrc = profile?.profileImage?.getDirectURL() || '';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img 
            src="/assets/generated/scholar-gold-app-icon-v4.dim_512x512.png" 
            alt="Scholar Gold" 
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-xl font-bold">Scholar Gold</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 rounded-full px-3">
                  <Avatar className="h-8 w-8" key={`avatar-${avatarKey}-${avatarSrc || 'fallback'}`}>
                    {avatarSrc && <AvatarImage src={`${avatarSrc}?v=${avatarKey}`} alt={profile.name} />}
                    <AvatarFallback>
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{profile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAuth}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleAuth}
              disabled={disabled}
              variant={isAuthenticated ? 'outline' : 'default'}
            >
              {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
