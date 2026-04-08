const { HttpsProxyAgent } = require("https-proxy-agent");

const PROXY_HOST = "p.webshare.io";
const PROXY_PORT = "80";

const PROXY_USER = process.env.PROXY_USER;
const PROXY_PASS = process.env.PROXY_PASS;

function createSessionId(seed = "") {
  return (seed || Math.random().toString(36).substring(2, 10))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10);
}

function getProxyUrl(sessionId) {
  const session = createSessionId(sessionId);
  return `http://${PROXY_USER}-session-${session}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}`;
}

function getProxyAgent(sessionId) {
  return new HttpsProxyAgent(getProxyUrl(sessionId));
}

module.exports = { getProxyAgent, getProxyUrl };