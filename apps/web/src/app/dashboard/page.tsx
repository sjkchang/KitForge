'use client';

import { useState } from 'react';
import { useSession, type User, authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  if (!session) {
    return null;
  }

  const isEmailVerified = session.user.emailVerified;

  const handleResendVerification = async () => {
    setResendError('');
    setResendLoading(true);
    setResendSuccess(false);

    try {
      await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: `${window.location.origin}/dashboard`,
      });

      setResendSuccess(true);
    } catch (err) {
      setResendError(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}!
        </p>
      </div>

      {!isEmailVerified && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">
              Email Verification Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Please verify your email address to access all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-yellow-800">
              We&apos;ve sent a verification link to{' '}
              <strong>{session.user.email}</strong>. Please check your inbox
              and spam folder.
            </p>

            {resendSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-900">
                Verification email sent! Please check your inbox.
              </div>
            )}

            {resendError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {resendError}
              </div>
            )}

            <Button
              onClick={handleResendVerification}
              variant="outline"
              disabled={resendLoading}
              className="bg-white"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {session.user.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground">
                {(session.user as User).role}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick links to help you begin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your SaaS starter kit is ready! You can now build your application
              with authentication already set up.
            </p>
          </CardContent>
        </Card>

        {(session.user as User).role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Tools</CardTitle>
              <CardDescription>Manage your application</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                As an admin, you have access to the Users page where you can
                view all registered users.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
