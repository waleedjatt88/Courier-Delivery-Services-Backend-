FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install nodemon -g

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && nodemon src/app.js"]
