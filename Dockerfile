FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY data ./data
COPY public ./public

RUN chmod +x scripts/docker-entrypoint.sh \
  && addgroup -S bazmet && adduser -S bazmet -G bazmet \
  && chown -R bazmet:bazmet /app

USER bazmet

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001

EXPOSE 3001

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
