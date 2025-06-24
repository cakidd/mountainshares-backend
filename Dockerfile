FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js ./

EXPOSE 8080

# Force Express server only - no static file serving
CMD ["node", "server.js"]
