import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import db from "../db.server";

export const loader = async ({ params }) => {
  const { token } = params;

  const deliveredOrder = await db.deliveredOrder.findUnique({
    where: { downloadToken: token },
  });

  if (!deliveredOrder) {
    throw new Response("Enlace no válido o caducado", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", deliveredOrder.fileUrl);

  if (!fs.existsSync(filePath)) {
    throw new Response("El archivo ya no está disponible", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const stream = Readable.toWeb(fs.createReadStream(filePath));

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${deliveredOrder.fileName}"`,
      "Content-Length": stat.size.toString(),
    },
  });
};