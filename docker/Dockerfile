FROM oven/bun:1

# Install additional dependencies for Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy everything
COPY . .

# Install dependencies
RUN bun install

# Generate Prisma client
RUN bunx prisma generate

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Create and set permissions for WhatsApp Web.js directories
RUN mkdir -p /usr/src/app/.wwebjs_auth /usr/src/app/.wwebjs_cache && \
    chown -R bun:bun /usr/src/app/.wwebjs_auth /usr/src/app/.wwebjs_cache && \
    chmod 755 /usr/src/app/.wwebjs_auth /usr/src/app/.wwebjs_cache

# Switch to non-root user
USER bun

EXPOSE 3000

# Run migrations and start the app
CMD ["sh", "-c", "bun run prisma generate && bun run prisma migrate deploy && bun run start"]