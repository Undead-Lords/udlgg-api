module.exports = {
  apps: [
    {
      name: "udlggAPIv2",
      script: "udlggAPI.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      },
      max_restarts: 3,
      restart_delay: 4000,
      max_memory_restart: "300M",
      autorestart: true
    }
  ]
};
