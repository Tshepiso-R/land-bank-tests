interface EnvironmentConfig {
  baseURL: string;
}

const environments: Record<string, EnvironmentConfig> = {
  qa: {
    baseURL: 'https://landbankcrm-adminportal-qa.shesha.app',
  },
  staging: {
    baseURL: 'https://landbankcrm-adminportal-staging.shesha.app',
  },
  prod: {
    baseURL: 'https://landbankcrm-adminportal.shesha.app',
  },
};

const ENV = process.env.TEST_ENV || 'qa';
const { baseURL } = environments[ENV];

export { environments, ENV, baseURL };
