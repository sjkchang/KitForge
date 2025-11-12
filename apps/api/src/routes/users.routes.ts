import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { jwtAuth, requireAdmin } from '../services/auth';
import { getUserRepository } from '../domains/users';
import {
    GetMeResponseSchema,
    GetUsersResponseSchema,
    UnauthorizedErrorSchema,
    ForbiddenErrorSchema,
    ErrorResponseSchema,
} from '../schemas';

const getMeRoute = createRoute({
    method: 'get',
    path: '/me',
    operationId: 'getCurrentUser',
    tags: ['User'],
    summary: 'Get current user',
    description: `Returns the currently authenticated user's profile information including role and email verification status.

**Use Cases:**
- Display user profile in UI
- Check user role for client-side authorization
- Verify email verification status

**Authentication:**
Requires a valid Bearer token in the Authorization header.`,
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: 'Successfully retrieved current user',
            content: {
                'application/json': {
                    schema: GetMeResponseSchema,
                    example: {
                        user: {
                            id: '550e8400-e29b-41d4-a716-446655440000',
                            name: 'John Doe',
                            email: 'john.doe@example.com',
                            emailVerified: true,
                            image: 'https://api.example.com/avatars/john.jpg',
                            role: 'user',
                            createdAt: '2025-01-15T10:30:00.000Z',
                            updatedAt: '2025-01-15T10:30:00.000Z',
                        },
                    },
                },
            },
        },
        401: {
            description:
                'Authentication required - No valid session or token provided',
            content: {
                'application/json': {
                    schema: UnauthorizedErrorSchema,
                    example: {
                        error: 'Authentication required',
                        code: 'UNAUTHORIZED',
                    },
                },
            },
        },
    },
    'x-codeSamples': [
        {
            lang: 'TypeScript',
            label: '@kit/api-client',
            source: `import { api } from '@kit/api-client';

// Option 1: Pass token per request
const { data, error } = await api.GET('/api/v1/me', {
  headers: { Authorization: \`Bearer \${token}\` },
});

// Option 2: Set token globally
api.setAuth(token);
const { data, error } = await api.GET('/api/v1/me');

if (error) {
  console.error('Error:', error.error);
} else {
  console.log('User:', data.user.name);
  console.log('Email:', data.user.email);
  console.log('Role:', data.user.role);
}`,
        },
        {
            lang: 'TypeScript',
            label: 'Server Component',
            source: `import { api, getSessionToken } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const token = await getSessionToken();

  const { data, error } = await api.GET('/api/v1/me', {
    headers: { Authorization: \`Bearer \${token}\` },
  });

  if (error || !data) {
    redirect('/login');
  }

  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>{data.user.email}</p>
    </div>
  );
}`,
        },
        {
            lang: 'TypeScript',
            label: 'Client Component',
            source: `'use client';

import { api } from '@kit/api-client';
import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

export function UserProfile() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchUser = async () => {
      const { data, error } = await api.GET('/api/v1/me', {
        headers: { Authorization: \`Bearer \${session.session.token}\` },
      });

      if (!error && data) {
        setUser(data.user);
      }
    };

    fetchUser();
  }, [session]);

  if (!user) return <div>Loading...</div>;

  return <div>Welcome, {user.name}</div>;
}`,
        },
    ],
} as const);

const getUsersRoute = createRoute({
    method: 'get',
    path: '/users',
    operationId: 'getAllUsers',
    tags: ['Admin'],
    summary: 'Get all users',
    description: `Retrieve a list of all registered users in the system.

**Requirements:**
- Admin role required
- Valid authentication token

**Use Cases:**
- User management dashboard
- System administration
- Analytics and reporting`,
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: 'Successfully retrieved list of all users',
            content: {
                'application/json': {
                    schema: GetUsersResponseSchema,
                    example: {
                        users: [
                            {
                                id: '550e8400-e29b-41d4-a716-446655440000',
                                name: 'John Doe',
                                email: 'john.doe@example.com',
                                emailVerified: true,
                                image: 'https://api.example.com/avatars/john.jpg',
                                role: 'user',
                                createdAt: '2025-01-15T10:30:00.000Z',
                                updatedAt: '2025-01-15T10:30:00.000Z',
                            },
                            {
                                id: '123e4567-e89b-12d3-a456-426614174000',
                                name: 'Jane Admin',
                                email: 'jane.admin@example.com',
                                emailVerified: true,
                                image: null,
                                role: 'admin',
                                createdAt: '2025-01-10T08:15:00.000Z',
                                updatedAt: '2025-01-14T16:20:00.000Z',
                            },
                        ],
                    },
                },
            },
        },
        401: {
            description:
                'Authentication required - No valid session or token provided',
            content: {
                'application/json': {
                    schema: UnauthorizedErrorSchema,
                    example: {
                        error: 'Authentication required',
                        code: 'UNAUTHORIZED',
                    },
                },
            },
        },
        403: {
            description:
                'Forbidden - Admin role required to access this endpoint',
            content: {
                'application/json': {
                    schema: ForbiddenErrorSchema,
                    example: {
                        error: 'Admin access required',
                        code: 'FORBIDDEN',
                    },
                },
            },
        },
        500: {
            description:
                'Internal server error - Failed to fetch users from database',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema,
                    example: {
                        error: 'Failed to fetch users',
                        code: 'INTERNAL_ERROR',
                    },
                },
            },
        },
    },
    'x-codeSamples': [
        {
            lang: 'TypeScript',
            label: '@kit/api-client',
            source: `import { api } from '@kit/api-client';

const { data, error } = await api.GET('/api/v1/users', {
  headers: { Authorization: \`Bearer \${token}\` },
});

if (error) {
  if (error.code === 'FORBIDDEN') {
    console.error('Admin access required');
  } else {
    console.error('Error:', error.error);
  }
} else {
  console.log(\`Found \${data.users.length} users\`);
  data.users.forEach(user => {
    console.log(\`- \${user.name} (\${user.email})\`);
  });
}`,
        },
        {
            lang: 'TypeScript',
            label: 'Server Component',
            source: `import { api, getSessionToken } from '@/lib/api';

export default async function UsersPage() {
  const token = await getSessionToken();

  const { data, error } = await api.GET('/api/v1/users', {
    headers: { Authorization: \`Bearer \${token}\` },
  });

  if (error) {
    if (error.code === 'FORBIDDEN') {
      return <div>Admin access required</div>;
    }
    return <div>Error loading users</div>;
  }

  return (
    <div>
      <h1>Users ({data.users.length})</h1>
      <ul>
        {data.users.map(user => (
          <li key={user.id}>
            {user.name} - {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        },
        {
            lang: 'TypeScript',
            label: 'Client Component',
            source: `'use client';

import { api } from '@kit/api-client';
import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

export function UsersList() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;

    const fetchUsers = async () => {
      const { data, error } = await api.GET('/api/v1/users', {
        headers: { Authorization: \`Bearer \${session.session.token}\` },
      });

      if (error) {
        setError(error.error);
      } else {
        setUsers(data.users);
      }
    };

    fetchUsers();
  }, [session]);

  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
        },
    ],
} as const);

const app = new OpenAPIHono();

app.use('/me', jwtAuth);
app.openapi(getMeRoute, (c) => {
    const user = c.get('user') as {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    };
    return c.json({ user }, 200);
});

app.use('/users', jwtAuth, requireAdmin);
app.openapi(getUsersRoute, async (c) => {
    try {
        const users = await getUserRepository().findAll();
        const sanitizedUsers = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            emailVerified: u.emailVerified,
            image: u.image,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
        }));

        return c.json({ users: sanitizedUsers }, 200);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

export const usersRoutes = app;
