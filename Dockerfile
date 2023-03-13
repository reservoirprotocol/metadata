FROM --platform linux/arm64 node:18.15-slim as dependencies
WORKDIR /metadata
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM --platform linux/arm64 node:18.15-slim as builder
WORKDIR /metadata
COPY . .
COPY --from=dependencies /metadata/node_modules ./node_modules
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]


m6g.2xlarge	0.308
m7g.2xlarge	0.3264
m6a.2xlarge 0.3456
m6i.2xlarge 0.384
