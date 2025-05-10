module.exports = {
  apps: [
    {
      name: "wa-site",
      cwd: "/app",
      script: "npm",
      args: "run start",
    },
    {
      name: "wa-api",
      cwd: "/app",
      interpreter: "none",
      script: "gowa",
    },
  ],
};
