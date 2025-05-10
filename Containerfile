FROM golang:alpine AS api-builder
ENV CGO_ENABLED=1
COPY gowa /app
WORKDIR /app
RUN --mount=type=cache,target=/go/pkg/mod apk add gcc musl-dev && go build -o gowa

FROM node:22-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm corepack pnpm install

FROM node:22-alpine AS production-dependencies-env
COPY ./package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm corepack pnpm install --prod

FROM node:22-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN corepack pnpm run build

FROM node:22-alpine
RUN npm install -g pm2
COPY pm2/ecosystem.config.cjs /app/ecosystem.config.cjs
COPY ./package.json pnpm-lock.yaml /app/
COPY --from=api-builder /app/gowa /app/gowa
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
EXPOSE 3000
ENTRYPOINT ["pm2-runtime", "ecosystem.config.cjs"]