import { POST } from '@/app/api/claim/route';
import { expect } from 'chai';
import { NextRequest } from 'next/server';

describe('/api/claim', () => {
  it('should reject invalid address', async () => {
    const req = new NextRequest('http://localhost:3000/api/claim', {
      method: 'POST',
      body: JSON.stringify({
        playerAddress: 'invalid',
        score: 200,
        sessionId: '0x' + '1'.repeat(64),
        timestamp: Date.now()
      })
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).to.equal(400);
    expect(data.error).to.exist;
  });
  
  it('should accept valid request', async () => {
    const req = new NextRequest('http://localhost:3000/api/claim', {
      method: 'POST',
      body: JSON.stringify({
        playerAddress: '0x' + 'a'.repeat(40),
        score: 500,
        sessionId: '0x' + '1'.repeat(64),
        timestamp: Date.now()
      })
    });

    const response = await POST(req);
    const data = await response.json();
    expect(response.status).to.equal(200);
    expect(data.transactionHash).to.exist;
  });


});