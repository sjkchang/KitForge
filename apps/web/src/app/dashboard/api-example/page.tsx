import { getApiClient } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function ApiExamplePage() {
  // Get the type-safe API client
  const api = await getApiClient();

  // Fetch current user with full type safety
  const { data: meData, error: meError } = await api.GET('/api/me');

  if (meError || !meData) {
    redirect('/login');
  }

  // Fetch all users (admin only) with full type safety
  const { data: usersData, error: usersError } = await api.GET('/api/users');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Type-Safe API Client Example</h1>

      <div className="space-y-8">
        {/* Current User */}
        <section className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Current User (GET /api/me)</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm">
              {JSON.stringify(meData.user, null, 2)}
            </pre>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            ✅ Fully type-safe: TypeScript knows the exact shape of the response
          </p>
        </section>

        {/* All Users */}
        <section className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            All Users (GET /api/users) - Admin Only
          </h2>
          {usersError ? (
            <div className="bg-red-50 text-red-800 p-4 rounded">
              <p className="font-semibold">Error:</p>
              <pre className="text-sm mt-2">{JSON.stringify(usersError, null, 2)}</pre>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded">
              <p className="mb-2 font-semibold">
                Total Users: {usersData?.users.length || 0}
              </p>
              <pre className="text-sm">
                {JSON.stringify(usersData?.users, null, 2)}
              </pre>
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600">
            ✅ Type-safe error handling: TypeScript knows possible error responses
          </p>
        </section>

        {/* Type Safety Demo */}
        <section className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Type Safety Benefits</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Autocomplete:</strong> Your IDE knows all available endpoints
            </li>
            <li>
              <strong>Type Checking:</strong> Response types are automatically inferred
            </li>
            <li>
              <strong>Error Safety:</strong> Errors are typed based on OpenAPI spec
            </li>
            <li>
              <strong>No Manual Typing:</strong> Types are generated from your API schema
            </li>
            <li>
              <strong>Always in Sync:</strong> Run <code>pnpm generate:client</code> to update
            </li>
          </ul>
        </section>

        {/* Code Example */}
        <section className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Example Code</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded">
            <pre className="text-sm">
{`import { getApiClient } from '@/lib/api';

// Get authenticated client
const api = await getApiClient();

// Make type-safe requests
const { data, error } = await api.GET('/api/me');

// TypeScript knows:
// - data?.user.email is a string
// - data?.user.emailVerified is a boolean
// - error?.error is a string (if present)

if (error) {
  console.error(error.error);
  return;
}

console.log(data.user.email); // ✅ Type-safe!`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
