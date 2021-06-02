FROM node:12 AS build
WORKDIR /usr/src/app
COPY ./ ./
RUN npm install
RUN npm run build

FROM node:12-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./
COPY --from=build /usr/src/app/node_modules ./node_modules
EXPOSE 3000
ENTRYPOINT ["node", "main.js"]
