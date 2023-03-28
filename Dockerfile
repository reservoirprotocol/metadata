FROM node:18.15-slim as dependencies
WORKDIR /metadata
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:18.15-slim as builder
WORKDIR /metadata
COPY . .
COPY --from=dependencies /metadata/node_modules ./node_modules
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
