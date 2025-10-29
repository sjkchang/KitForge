'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut, type User } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = (session.user as User).role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              SaaS Kit
            </Link>
            <nav className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/users"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Users
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name} ({(session.user as User).role})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
