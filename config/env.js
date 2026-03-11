const environments = {
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

module.exports = { environments, ENV, ...environments[ENV] };
