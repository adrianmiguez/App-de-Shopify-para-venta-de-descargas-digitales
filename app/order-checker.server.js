import cron from "node-cron";
import { unauthenticated } from "./shopify.server";
import db from "./db.server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
let isRunning = false;

export function startOrderChecker() {
  if (isRunning) return;
  isRunning = true;

  cron.schedule("*/2 * * * *", async () => {
    console.log("🔍 Revisando pedidos pagados...");

    const digitalFiles = await db.digitalFile.findMany();
    const shops = [...new Set(digitalFiles.map((f) => f.shop))];

    for (const shop of shops) {
      try {
        const { admin } = await unauthenticated.admin(shop);

        const response = await admin.graphql(
          `#graphql
          query getRecentOrders {
            orders(first: 10, query: "financial_status:paid", sortKey: CREATED_AT, reverse: true) {
              edges {
                node {
                  id
                  name
                  email
                  lineItems(first: 20) {
                    edges {
                      node {
                        product {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }`
        );

        const data = await response.json();
        const orders = data.data.orders.edges.map((e) => e.node);

        for (const order of orders) {
          if (!order.email) continue;

          for (const item of order.lineItems.edges) {
            const productId = item.node.product?.id;
            if (!productId) continue;

            const digitalFile = digitalFiles.find(
              (f) => f.shop === shop && f.productId === productId
            );
            if (!digitalFile) continue;

            const alreadySent = await db.deliveredOrder.findFirst({
              where: { shop, orderId: order.id, productId },
            });
            if (alreadySent) continue;

            // Respetar fecha de liberación
            if (digitalFile.releaseDate && new Date() < digitalFile.releaseDate) {
              console.log(`⏳ "${digitalFile.fileName}" aún no liberado`);
              continue;
            }

            const downloadToken = crypto.randomUUID();
            const downloadUrl = `${process.env.SHOPIFY_APP_URL}/download/${downloadToken}`;

            await resend.emails.send({
              from: "onboarding@resend.dev",
              to: order.email,
              subject: `Tu archivo digital — pedido ${order.name}`,
              html: `<p>¡Gracias por tu compra!</p><p>Ya puedes descargar tu archivo <strong>${digitalFile.fileName}</strong> desde este enlace:</p><p><a href="${downloadUrl}">${downloadUrl}</a></p>`,
            });

            await db.deliveredOrder.create({
              data: {
                shop,
                orderId: order.id,
                productId,
                fileName: digitalFile.fileName,
                fileUrl: digitalFile.fileUrl,
                downloadToken,
              },
            });

            console.log(`✅ Email enviado a ${order.email} — "${digitalFile.fileName}"`);
          }
        }
      } catch (err) {
        console.error(`Error revisando pedidos de ${shop}:`, err.message);
      }
    }
  });

  console.log("✅ Revisor de pedidos automático iniciado (cada 2 minutos)");
}