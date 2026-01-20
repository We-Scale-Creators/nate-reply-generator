'use client';

import { useState, useCallback } from 'react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tweetContent: string; reply: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateReply = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to generate reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.reply) {
      navigator.clipboard.writeText(result.reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Nate Reply Generator</h1>
        <p className="text-zinc-400 mb-8">Upload a tweet screenshot. Get a reply in Nate&apos;s voice.</p>

        {!image ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-zinc-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">Drop tweet screenshot here</p>
                <p className="text-sm mt-2">or click to browse</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <img src={image} alt="Tweet" className="rounded-xl w-full" />
              <button
                onClick={reset}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!result && !loading && (
              <button
                onClick={generateReply}
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Generate Reply
              </button>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                <p className="mt-4 text-zinc-400">Reading tweet and crafting reply...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Tweet detected</p>
                  <p className="text-zinc-300">{result.tweetContent}</p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Your reply</p>
                  <p className="text-white text-lg">{result.reply}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy Reply'}
                  </button>
                  <button
                    onClick={generateReply}
                    className="flex-1 bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-zinc-700 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
