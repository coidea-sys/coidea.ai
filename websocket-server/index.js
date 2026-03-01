// WebSocket server for Cloudflare Workers
// Simplified version without Durable Objects for now

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        onlineUsers: 0,
        onlineAgents: 0,
        activeRooms: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }
      
      const [client, server] = Object.values(new WebSocketPair());
      
      server.accept();
      
      server.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          // Echo back for now
          server.send(JSON.stringify({
            type: 'echo',
            data: data,
            timestamp: Date.now()
          }));
        } catch (e) {
          server.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON'
          }));
        }
      });
      
      server.addEventListener('close', () => {
        console.log('WebSocket closed');
      });
      
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    
    // API endpoints
    if (url.pathname === '/api/online/users') {
      return new Response(JSON.stringify({
        count: 0,
        users: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
