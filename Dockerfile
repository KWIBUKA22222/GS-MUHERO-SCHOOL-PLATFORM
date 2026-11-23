# GS Muhero platform: Node.js 22 (node:sqlite ibamo ubwayo, nta npm install isabwa)
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/gsm.sqlite
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
