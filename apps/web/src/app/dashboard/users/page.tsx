'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, type User as AuthUser } from '@/lib/auth-client';
import { api } from '@kit/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (!isPending && session && (session.user as AuthUser).role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      if (!session) return;

      try {
        // Make type-safe API call with authentication
        const { data, error } = await api.GET('/api/v1/users', {
          headers: { Authorization: `Bearer ${session.session.token}` },
        });

        if (error) {
          throw new Error('Failed to fetch users');
        }

        if (data) {
          setUsers(data.users);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (session && (session.user as AuthUser).role === 'admin') {
      fetchUsers();
    }
  }, [session, isPending, router]);

  if (isPending || (session && (session.user as AuthUser).role !== 'admin')) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage all registered users in your application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found</p>
          )}

          {!loading && !error && users.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={
                          user.role === 'admin'
                            ? 'rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary'
                            : 'rounded-full bg-secondary px-2 py-1 text-xs font-medium'
                        }
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
