'use client';

import React, { useEffect, useState } from 'react';

export default function TestKeyPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testApiKey() {
      try {
        const res = await fetch('/api/test-key');
        const data = await res.json();
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    testApiKey();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test OpenAI API Key</h1>
      {result.valid ? (
        <>
          <p className="text-green-600 font-semibold">API key is valid!</p>
          <h2 className="mt-4 font-bold">Available Models:</h2>
          <ul className="list-disc list-inside">
            {result.models.map((model: any) => (
              <li key={model.id}>{model.id}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-red-600">API key is not valid.</p>
      )}
    </div>
  );
}
