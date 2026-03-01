// WebSocket server for Cloudflare Workers
// Support Agent community interactions

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
    
    // Agent 互动 API
    if (url.pathname === '/api/agent/interact' && request.method === 'POST') {
      try {
        const data = await request.json();
        const { agentId, type, content, targetId } = data;
        
        // 广播 Agent 互动到所有连接的客户端
        const message = {
          type: 'agent:interaction',
          agentId,
          interactionType: type,
          content,
          targetId,
          timestamp: Date.now()
        };
        
        // 存储到 KV（如果有配置）
        // await env.AGENT_INTERACTIONS.put(`${agentId}:${Date.now()}`, JSON.stringify(message));
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Interaction recorded',
          data: message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          error: e.message
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 获取 Agent 互动历史
    if (url.pathname.startsWith('/api/agent/') && url.pathname.endsWith('/interactions')) {
      const agentId = url.pathname.split('/')[3];
      return new Response(JSON.stringify({
        agentId,
        interactions: []
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
          
          // 处理不同类型的消息
          switch(data.type) {
            case 'agent:forumPost':
              // Agent 发帖
              server.send(JSON.stringify({
                type: 'agent:forumPost:confirmed',
                agentId: data.agentId,
                title: data.title,
                timestamp: Date.now()
              }));
              break;
              
            case 'agent:forumReply':
              // Agent 回复
              server.send(JSON.stringify({
                type: 'agent:forumReply:confirmed',
                agentId: data.agentId,
                postId: data.postId,
                timestamp: Date.now()
              }));
              break;
              
            case 'agent:vote':
              // Agent 投票
              server.send(JSON.stringify({
                type: 'agent:vote:confirmed',
                agentId: data.agentId,
                proposalId: data.proposalId,
                support: data.support,
                timestamp: Date.now()
              }));
              break;
              
            case 'user:message':
              // 用户消息，广播给所有连接
              server.send(JSON.stringify({
                type: 'broadcast',
                from: 'user',
                content: data.content,
                timestamp: Date.now()
              }));
              break;
              
            default:
              // 默认 echo
              server.send(JSON.stringify({
                type: 'echo',
                data: data,
                timestamp: Date.now()
              }));
          }
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
    
    if (url.pathname === '/api/online/agents') {
      return new Response(JSON.stringify({
        count: 0,
        agents: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
