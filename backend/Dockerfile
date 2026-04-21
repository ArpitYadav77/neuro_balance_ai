FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 4000

CMD ["node", "src/index.js"]
