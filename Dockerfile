FROM node:22-alpine
WORKDIR /app
COPY index.html app.css app.js server.js ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
