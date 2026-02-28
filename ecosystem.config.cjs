// PM2 Ecosystem Configuration for DMS Hub Backend
// Deploy to Hetzner VPS: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "dmshub-backend",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      // Graceful shutdown (matches SIGTERM handler in index.ts)
      kill_timeout: 10000, // Wait 10s for graceful shutdown
      listen_timeout: 8000, // Wait 8s for app to be ready
      // Restart strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s", // Consider crashed if restarts in <10s
      restart_delay: 3000, // Wait 3s between restarts (Neon cold start)
      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Watch (disabled in production)
      watch: false,
    },
  ],
};
