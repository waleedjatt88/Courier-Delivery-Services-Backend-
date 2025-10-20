FROM node:18-bullseye



RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*


RUN pip install --no-cache-dir \
    flask \
    scikit-learn \
    pandas \
    requests


WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && npm run dev"]