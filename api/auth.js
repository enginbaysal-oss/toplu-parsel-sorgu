const check = require('./_auth');
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const hit = check(req.query && req.query.k);
  res.setHeader('Content-Type', 'application/json');
  if (!hit) { res.statusCode = 401; return res.end(JSON.stringify({ok: false})); }
  res.end(JSON.stringify({ok: true, name: hit.name, until: hit.until || null}));
};
