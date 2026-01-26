FROM node:20-bookworm-slim

# Install Chromium and fonts for PDF rendering
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
