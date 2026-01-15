export default async function handler(req: any, res: any) {
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return res.status(200).end();
  }

  // Get the path from the request
  const path = (req.query.path as string[])?.join('/') || '';
  const apiUrl = `https://darkw.ai/api/${path}`;

  // Get query string (excluding 'path' parameter)
  const queryParams = { ...req.query };
  delete queryParams.path;
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
  const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

  try {
    // Prepare headers to mimic a browser request
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://platform.dar-kuwait.com/',
    };

    // Add content type if present
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // Forward authorization if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Prepare body for POST/PUT/PATCH requests
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }

    // Forward the request
    const response = await fetch(fullUrl, {
      method: req.method,
      headers,
      body,
    });

    // Get response data
    const data = await response.text();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');

    // Forward status and data
    return res.status(response.status).send(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      url: fullUrl 
    });
  }
}

