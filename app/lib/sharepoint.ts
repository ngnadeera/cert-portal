import { graphClient } from "./graph";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function getSiteId() {
  const client = graphClient();
  const hostname = must("SHAREPOINT_HOSTNAME");
  const sitePath = must("SHAREPOINT_SITE_PATH");

  const site = await client.api(`/sites/${hostname}:${sitePath}`).get();
  return site.id as string;
}

export async function getListId(siteId: string) {
  const client = graphClient();
  const listName = must("CERT_LIST_NAME");

  const lists = await client.api(`/sites/${siteId}/lists?$select=id,displayName`).get();
  const found = (lists.value as any[]).find((l) => l.displayName === listName);

  if (!found) throw new Error(`List not found: ${listName}`);
  return found.id as string;
}

export async function findByCertificateId(siteId: string, listId: string, certificateId: string) {
  const client = graphClient();
  const safe = certificateId.replace(/'/g, "''");

  const res = await client
    .api(`/sites/${siteId}/lists/${listId}/items`)
    .expand("fields")
    .filter(`fields/Title eq '${safe}'`)
    .top(1)
    .get();

  return res.value?.[0] ?? null;
}
