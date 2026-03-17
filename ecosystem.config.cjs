/**
 * PM2 ecosystem — web (Next.js) + worker (BullMQ).
 * Kullanim: pm2 start ecosystem.config.cjs
 * Restart: pm2 restart ecosystem.config.cjs veya pm2 restart all
 */
module.exports = {
  apps: [
    {
      name: 'herokidstory',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'herokidstory-worker',
      script: 'node_modules/.bin/tsx',
      args: 'worker.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
    },
  ],
}
