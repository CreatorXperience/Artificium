type TIntegrationConfig = any;

class IntegrationBase {
  haswebhook: boolean;
  constructor() {
    this.haswebhook = false;
  }

  connect(data: any) {
    console.log(data);
    throw new Error('connect not implemented');
  }

  disconnect<T>(data: T) {
    console.log(data);
    throw new Error('disconnect not implemented');
  }

  recieveWebHook() {
    throw new Error('recieveWebHook not implemented');
  }
}

export default IntegrationBase;
