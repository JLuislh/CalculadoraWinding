module.exports = {
  apps: [
    {
      name        : 'calculo-winding',
      script      : 'server.js',
      instances   : 1,
      autorestart : true,
      watch       : false,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
        PORT    : 3000
      }
    }
  ]
};
