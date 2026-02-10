import { Timer, CheckSquare, Calendar, BookOpen, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/generated/scholar-gold-app-icon-v3.dim_512x512.png" 
              alt="Scholar Gold" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="text-xl font-bold">Scholar Gold</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight">
              Your Ultimate Exam Preparation Companion
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Stay organized, focused, and motivated with our all-in-one productivity platform designed specifically for students.
            </p>
          </div>

          <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Timer className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Focus Timer</CardTitle>
                <CardDescription>
                  Pomodoro timer with background tracking and coin rewards for staying focused
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckSquare className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Task Management</CardTitle>
                <CardDescription>
                  Organize your assignments and study tasks with priority levels and subjects
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Daily Timetable</CardTitle>
                <CardDescription>
                  Schedule your classes, revision sessions, and breaks in one place
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Smart Notes</CardTitle>
                <CardDescription>
                  Take notes with rich text, images, and voice recordings for better retention
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Reminders</CardTitle>
                <CardDescription>
                  Never miss a deadline with customizable reminder notifications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Gamification</CardTitle>
                <CardDescription>
                  Earn coins, build streaks, and unlock custom backgrounds as you study
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mx-auto max-w-md border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started Today</CardTitle>
              <CardDescription>
                Sign in securely with Internet Identity to access all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="w-full"
              >
                {isLoggingIn ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    Logging in...
                  </>
                ) : (
                  'Login with Internet Identity'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New users receive 500 coins as a welcome bonus!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
