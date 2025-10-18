'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

export default function APITestPage() {
  const [getResponse, setGetResponse] = useState('');
  const [postResponse, setPostResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Test data
  const [testAddress, setTestAddress] = useState('0x97236A4A5A3Fba78AA248C4b6130e0946Fd8421d');
  const [testScore, setTestScore] = useState(200);

  const testGET = async () => {
    setLoading(true);
    setGetResponse('Loading...');
    
    try {
      const timestamp = Date.now();
      const url = `/api/claim?address=${testAddress}&score=${testScore}&timestamp=${timestamp}`;
      
      console.log('🔍 Testing GET:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      setGetResponse(JSON.stringify(data, null, 2));
      console.log('✅ GET Response:', data);
    } catch (error: any) {
      setGetResponse(`Error: ${error.message}`);
      console.error('❌ GET Error:', error);
    } finally {
      setLoading(false);
    }
  };

  function generateSessionId(testAddress: string, testScore: number, timestamp: number) {
  const data = ethers.solidityPacked(
      ['address', 'uint256', 'uint256'],
      [testAddress, testScore, timestamp]
    );
    return ethers.keccak256(data);
}

  const testPOST = async () => {
    setLoading(true);
    setPostResponse('Loading...');
    
    try {
      const timestamp = Date.now();
      const sessionId = generateSessionId(testAddress, testScore, timestamp);
      
      const body = {
        playerAddress: testAddress,
        score: testScore,
        sessionId,
        timestamp
      };
      
      console.log('🔍 Testing POST:', body);
      
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      setPostResponse(JSON.stringify(data, null, 2));
      console.log('✅ POST Response:', data);
      
      if (data.txHash) {
        console.log('🔗 View transaction:', `https://amoy.polygonscan.com/address/${data.txHash}`);
      }
    } catch (error: any) {
      setPostResponse(`Error: ${error.message}`);
      console.error('❌ POST Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 API Test Page</h1>
        
        {/* Test Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Address:
              </label>
              <input
                type="text"
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
                placeholder="0x..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Score:
              </label>
              <input
                type="number"
                value={testScore}
                onChange={(e) => setTestScore(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="200"
              />
              <p className="text-xs text-gray-400 mt-1">
                {testScore / 100} coins (score must be multiple of 100)
              </p>
            </div>
          </div>
        </div>

        {/* GET Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📥 Test GET /api/claim</h2>
          <p className="text-sm text-gray-400 mb-4">
            Tests signature generation endpoint
          </p>
          
          <button
            onClick={testGET}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-bold transition"
          >
            {loading ? 'Testing...' : 'Test GET Request'}
          </button>
          
          {getResponse && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Response:</h3>
              <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-xs">
                {getResponse}
              </pre>
            </div>
          )}
        </div>

        {/* POST Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📤 Test POST /api/claim</h2>
          <p className="text-sm text-gray-400 mb-4">
            Tests token minting endpoint (will actually mint tokens!)
          </p>
          
          <button
            onClick={testPOST}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold transition"
          >
            {loading ? 'Testing...' : 'Test POST Request (Mint Tokens)'}
          </button>
          
          {postResponse && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Response:</h3>
              <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-xs">
                {postResponse}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📋 Instructions</h2>
          <ol className="space-y-2 text-sm">
            <li>1. Make sure your dev server is running (<code>npm run dev</code>)</li>
            <li>2. Configure your test address and score above</li>
            <li>3. Click "Test GET Request" to get a signature</li>
            <li>4. Click "Test POST Request" to mint tokens (requires setup)</li>
            <li>5. Check browser console (F12) for detailed logs</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500 rounded">
            <p className="text-yellow-200 text-sm">
              ⚠️ <strong>Note:</strong> POST request will fail if:
            </p>
            <ul className="text-yellow-200 text-xs mt-2 ml-4 space-y-1">
              <li>• Backend wallet is not a game admin</li>
              <li>• Backend wallet has no ETH for gas</li>
              <li>• Contract address is wrong</li>
              <li>• Session ID already used</li>
            </ul>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4">
          <a
            href="/"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            ← Back Home
          </a>
          <a
            href="/game"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition"
          >
            🎮 Play Game
          </a>
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            View Blockchain →
          </a>
        </div>
      </div>
    </div>
  );
}


