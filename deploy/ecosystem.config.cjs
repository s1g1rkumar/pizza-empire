module.exports = {
  apps: [
    {
      name: 'pizza-empire-api',
      script: 'dist/server.js',
      cwd: '/var/www/pizza-empire/backend',
      // Single fork instance prevents duplicate in-process SimulationScheduler ticks
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      out_file: '/var/log/pizza-empire/api-out.log',
      error_file: '/var/log/pizza-empire/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
    },
  ],
};
