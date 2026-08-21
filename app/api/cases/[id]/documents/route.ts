import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth";
import { canEditAppeal } from "@/lib/cases";
import { listCaseDocuments, uploadCaseDocument } from "@/lib/documents";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await authorizeRequest(request))) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    return NextResponse.json({ documents: await listCaseDocuments(id) });
  } catch (error) {
    console.error("Document list failed", error);
    return NextResponse.json(
      { error: "Case documents could not be loaded." },
      { status: 502 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const analyst = await authorizeRequest(request);
  if (!analyst) {
    return NextResponse.json({ error: "Analyst access is required." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    if (!(await canEditAppeal(id, analyst))) {
      return NextResponse.json(
        { error: "This case is assigned to another analyst." },
        { status: 403 },
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    const documentType = String(form.get("documentType") ?? "other")
      .trim()
      .slice(0, 100);
    const title = String(form.get("title") ?? "")
      .trim()
      .slice(0, 500);
    if (!(file instanceof File) || !title) {
      return NextResponse.json(
        { error: "A document and title are required." },
        { status: 400 },
      );
    }
    const document = await uploadCaseDocument(
      id,
      file,
      documentType,
      title,
      analyst.email,
    );
    return NextResponse.json({ document });
  } catch (error) {
    console.error("Document upload failed", error);
    const message =
      error instanceof Error ? error.message : "The document could not be uploaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
