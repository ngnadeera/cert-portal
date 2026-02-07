import { NextResponse } from "next/server";

export async function POST(req: Request) {

        const body = await req.json().catch(() => ({}));
        const certificateId = (body.certificateId ?? "").toString().trim();

        if (!certificateId) {
                return NextResponse.json({error: "Certificate ID is required"}, {status: 400});

        }


        return NextResponse.json({
                certificateId,
                status: "valid",
                message: "API working fine: connect sharepooint graph"
        });


}