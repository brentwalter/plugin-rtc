const { flags } = require('@oclif/command');
const { displayAppInfo, getAppInfo, deploy, verifyAppDirectory } = require('../../../../helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployCommand extends TwilioClientCommand {
  async run() {
    await super.run();

    if (this.flags['app-directory']) {
      try {
        verifyAppDirectory(this.flags['app-directory']);
      } catch (err) {
        console.log(err.message);
        return;
      }
    }

    this.appInfo = await getAppInfo.call(this);

    if (this.appInfo && !this.flags.override) {
      console.log('A Video app is already deployed. Use the --override flag to override the existing deployment.');
      await displayAppInfo.call(this, this.flags['environment']);
      return;
    }
    await deploy.call(this);
    await displayAppInfo.call(this, this.flags['environment']);
  }
}
DeployCommand.flags = Object.assign(
  {
    'app-directory': flags.string({
      description: 'Name of app directory to use',
      required: false,
    }),
    authentication: flags.enum({
      options: ['passcode'],
      description: 'Type of authentication to use',
      required: true,
    }),
    override: flags.boolean({
      required: false,
      default: false,
      description: 'Override an existing App deployment',
    }),
    environment: flags.enum({
      options: ['dev', 'prod'],
      description: 'The environment to deploy the function and assets: dev, prod.',
      required: false,
      default: 'dev',
    }),
  },
  TwilioClientCommand.flags
);

DeployCommand.usage = 'rtc:apps:video:deploy --authentication <auth>';

DeployCommand.description = `Deploy a Programmable Video app

This command publishes two components as a Twilio Function: an application token
server and an optional React application.

Token Server
The token server provides Programmable Video access tokens and authorizes
requests with the specified authentication mechanism.

React Application
The commands includes support for publishing a Programmable Video React
Application. For more details using this plugin with the Programmable Video
React application, please visit the project's home page.
https://github.com/twilio/twilio-video-app-react
`;

DeployCommand.examples = [
  `# Deploy an application token server with passcode authentication
$ twilio rtc:apps:video:deploy --authentication passcode
deploying app... done
Passcode: 1111111111`,
  `
# Deploy an application token server to production environment
# There are two environments: "dev" and "prod". "dev" is default.
# This is an optional flag. Defaults to "dev", development environment
$ twilio rtc:apps:video:deploy --authentication passcode --environment prod
deploying app... done
Passcode: 1111111111`,
  `
# Deploy an application token server with the React app
$ twilio rtc:apps:video:deploy --authentication passcode --app-directory /path/to/app
deploying app... done
Web App URL: https://video-app-1111-dev.twil.io?passcode=1111111111
Passcode: 1111111111`,
  `
# Override an existing app with a fresh deployment
# Please note that this will remove a previously deployed web application if no
# app directory is provided
$ twilio rtc:apps:video:deploy --authentication passcode --override
Removed app with Passcode: 1111111111
deploying app... done
Passcode: 2222222222
Expires: Mon Mar 09 2020 16:36:23 GMT-0600`,
];

module.exports = DeployCommand;
