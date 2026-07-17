// skill.platform.docker — production-shaped actions (EDR-007)
export const actions = {
  describe: async () => ({
    id: 'skill.platform.docker',
    capabilities: ['docker.build', 'docker.run'],
  }),

  planDockerfile: async (args = {}) => {
    const { runtime = 'node:20-alpine' } = args;
    return {
      ok: true,
      files: {
        Dockerfile: [
          `FROM ${runtime}`,
          'WORKDIR /app',
          'COPY package*.json ./',
          'RUN npm ci --omit=dev',
          'COPY . .',
          'CMD ["node", "server.js"]',
        ].join('\n'),
        'docker-compose.yml': [
          'services:',
          '  app:',
          '    build: .',
          '    ports: ["3000:3000"]',
        ].join('\n'),
      },
    };
  },
};

export async function initialize() {
  return { actions };
}
