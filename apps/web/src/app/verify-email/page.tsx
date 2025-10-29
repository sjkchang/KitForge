'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/dashboard`,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-blue-700">
                We sent a verification link to <strong>{email}</strong>
              </p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-900">
              <p className="font-medium">Verification email sent!</p>
              <p className="mt-1 text-green-700">
                Please check your inbox and spam folder
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Click the link in the email to verify your account.</p>
            <p>
              Didn&apos;t receive the email? Check your spam folder or request
              a new one below.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {email && (
            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
