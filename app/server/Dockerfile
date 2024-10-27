# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . ./

COPY target/types/crowd_estate.ts target/types/crowd_estate.ts
COPY target/idl/crowd_estate.json target/idl/crowd_estate.json 

RUN yarn build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/dist ./dist

RUN yarn install --production --frozen-lockfile

EXPOSE 5500 

ENV NODE_ENV=production

CMD ["node", "dist/src/server.js"]
