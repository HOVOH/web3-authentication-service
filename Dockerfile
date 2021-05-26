FROM node:12

RUN npm install -g typescript ts-node
WORKDIR /usr/src/app
COPY ./ ./
RUN npm install
RUN npm run build
EXPOSE 3000
ENTRYPOINT ["npm", "run", "start:prod"]
