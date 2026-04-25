# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Force installation of @types/express and typescript
RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]