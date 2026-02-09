import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";

function must(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function graphClient() {

    const credential = new ClientSecretCredential(
        must("AZURE_TENANT_ID"),
        must("AZURE_CLIENT_ID"),
        must("AZURE_CLIENT_SECRET")
    );


return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken("https://graph.microsoft.com/.default");
        if (!token?.token) throw new Error("Could not get Graph token");
        return token.token;
      },
    }
})

}