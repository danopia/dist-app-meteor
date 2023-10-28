import { ArbitraryEntity } from "../entities/core";


export class ApiView {
  constructor(
  ) {
  }
  readonly apiVersionImpls = new Map<string, ApiVersionView>();

  async callRpc(rpc: ArbitraryEntity) {
    const apiImpl = this.apiVersionImpls.get(rpc.apiVersion);
    if (!apiImpl) throw new Error(`unregistered apiVersion ${rpc.apiVersion}`);
    const response = await apiImpl.callRpc(this, rpc);
    return response;
  }

}

export interface ApiVersionView {
  callRpc(apiView: ApiView, data: ArbitraryEntity): Promise<null | ArbitraryEntity | ReadableStream<ArbitraryEntity>>;
  // versions: Array<{
  //   version: string;
  // }>;
  // interface:
  //   | {
  //       type: 'ForeignProxy';
  //       backingUrl: string;
  //     }
  //   | {
  //       type: 'EntityCatalog';
  //       entities: Array<{}>;
  //     }
    // ;
}
