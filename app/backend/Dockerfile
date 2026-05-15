FROM docker.m.daocloud.io/library/node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm_config_build_from_source=true npm ci --omit=dev

COPY . .

ENV PORT=3001
ENV DATABASE_FILE=/data/production.db

EXPOSE 3001

CMD ["npm", "start"]
