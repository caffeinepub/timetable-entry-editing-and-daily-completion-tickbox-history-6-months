import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, CheckSquare, Calendar, BookOpen, Bell, Settings, User } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TimerSection } from './components/TimerSection';
import { TodoSection } from './components/TodoSection';
import { TimetableSection } from './components/TimetableSection';
import { NotesSection } from './components/NotesSection';
import { RemindersSection } from './components/RemindersSection';
import { BackgroundSettings } from './components/BackgroundSettings';
import { ProfileSection } from './components/ProfileSection';
import { ReminderNotifications } from './components/ReminderNotifications';
import { LoginScreen } from './components/LoginScreen';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ProfileSetupDialog } from './components/ProfileSetupDialog';

const BACKGROUND_STORAGE_KEY = 'exam-prep-background';

function App() {
  const [background, setBackground] = useState<string>('');
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    const savedBackground = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (savedBackground) {
      setBackground(savedBackground);
    }
  }, []);

  const handleBackgroundChange = (newBackground: string) => {
    setBackground(newBackground);
    localStorage.setItem(BACKGROUND_STORAGE_KEY, newBackground);
  };

  const backgroundStyle = background
    ? background.startsWith('linear-gradient')
      ? { background }
      : { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : {};

  // Show loading state while checking authentication
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginScreen />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show main dashboard when authenticated
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col" style={backgroundStyle}>
        <div className="flex min-h-screen flex-col bg-background/95 backdrop-blur-sm">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-4xl font-bold tracking-tight">Scholar Gold</h1>
                <p className="text-muted-foreground">
                  Your all-in-one productivity companion for exam success
                </p>
              </div>

              <Tabs defaultValue="timer" className="w-full">
                <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="timer" className="gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="hidden sm:inline">Timer</span>
                  </TabsTrigger>
                  <TabsTrigger value="todo" className="gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">To-Do</span>
                  </TabsTrigger>
                  <TabsTrigger value="timetable" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Timetable</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Reminders</span>
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timer" className="mt-6">
                  <TimerSection />
                </TabsContent>

                <TabsContent value="todo" className="mt-6">
                  <TodoSection />
                </TabsContent>

                <TabsContent value="timetable" className="mt-6">
                  <TimetableSection />
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <NotesSection />
                </TabsContent>

                <TabsContent value="reminders" className="mt-6">
                  <RemindersSection />
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <ProfileSection />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <BackgroundSettings
                    onBackgroundChange={handleBackgroundChange}
                    currentBackground={background}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
          <Footer />
          <ReminderNotifications />
          <Toaster />
          {showProfileSetup && <ProfileSetupDialog />}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
