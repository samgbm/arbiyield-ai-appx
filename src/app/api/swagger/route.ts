import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";

/**
 * @swagger
 * /api/swagger:
 *   get:
 *     tags:
 *       - Docs
 *     summary: OpenAPI JSON specification
 *     description: Returns the generated OpenAPI 3.0 document for this API.
 *     responses:
 *       200:
 *         description: OpenAPI document
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
