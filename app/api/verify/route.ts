import { NextResponse } from "next/server";
import { getSiteId, getListId, findByCertificateId } from "@/app/lib/sharepoint";


export async function POST(req: Request) {

try {
        const body = await req.json().catch(() => ({}));
        const certificateId = (body.certificateId ?? "").toString().trim();

        if (!certificateId) {
                return NextResponse.json({error: "Certificate ID is required"}, {status: 400});

        }

        const siteId = await getSiteId();
        const listId = await getListId(siteId);

        const item = await findByCertificateId(siteId, listId, certificateId);

        if (!item) {
            return NextResponse.json({status: "NotFound", message: "Certificate not found" }, { status: 404 } );
        }


        const f = item.fields ?? {};

        const status = (f.Status ?? "Active").toString();
        const expiresAt = f.ExpiresAt ? new Date(f.ExpiresAt) : null;

        let computedStatus = status;
    let daysRemaining: number | null = null;

    if (expiresAt) {
      const now = new Date();
      daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (now > expiresAt && status.toLowerCase() !== "revoked") computedStatus = "Expired";
      if (daysRemaining < 0) daysRemaining = 0;
    }


         return NextResponse.json({
      certificateId: f.CertificateId ?? certificateId,
      fullName: f.FullName ?? "—",
      level: f.Level ?? "—",
      productName: f.ProductName ?? "—",
      issueYear: f.IssueYear ?? "—",
      status: computedStatus,
      issuedAt: f.IssuedAt ?? null,
      expiresAt: f.ExpiresAt ?? null,
      daysRemaining,
    });


    } catch (error: any) {
       
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }

}