import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  const lineItems = payload.line_items || [];

  for (const item of lineItems) {
    const productId = `gid://shopify/Product/${item.product_id}`;

    const digitalFile = await db.digitalFile.findFirst({
      where: {
        shop,
        productId,
      },
    });

    if (digitalFile) {
      console.log(
        `📦 Pedido pagado: hay que entregar "${digitalFile.fileName}" para el producto ${item.title}`
      );

      // Aquí en la pieza 4 añadiremos el envío real del archivo
    }
  }

  return new Response();
}; 