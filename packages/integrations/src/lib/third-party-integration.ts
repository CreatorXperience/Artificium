import IntegrationBase from './integration-base';
type TSlackAuthenticationPayload = any;

class SlackIntegration extends IntegrationBase {
  constructor(config) {
    super(config);
    this.config = config;
  }

  connect(data: TSlackAuthenticationPayload): void {
    console.log(data);
  }

  disconnect(data: TSlackAuthenticationPayload): void {
    console.log(data);
  }

  recieveWebHook(): void {
    console.log('webhook recieved');
  }
}

export { SlackIntegration };
