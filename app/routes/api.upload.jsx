import { authenticate } from "../shopify.server";
import db from "../db.server";
import fs from "node:fs/promises";
import path from "node:path";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();

  const productId = formData.get("productId");
  const releaseDate = formData.get("releaseDate");
  const file = formData.get("file");

  if (!productId || !file || !file.name) {
    return new Response(JSON.stringify({ error: "Falta el producto o el archivo" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = path.join(uploadsDir, file.name);
  await fs.writeFile(filePath, buffer);

  await db.digitalFile.create({
    data: {
      shop,
      productId,
      fileName: file.name,
      fileUrl: file.name,
      releaseDate: releaseDate && !isNaN(new Date(releaseDate)) ? new Date(releaseDate) : null,
    },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};