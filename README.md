# App de Shopify para venta de descargas digitales

App para [Shopify App Store](https://apps.shopify.com/) que permite a cualquier tienda vender productos digitales (ebooks, plantillas, presets, packs de archivos, etc.) con entrega automática al comprador tras el pago.

## Problema que resuelve

Shopify no tiene una función nativa para vender descargas digitales: en cuanto un producto no es físico, el comerciante necesita una app aparte que asocie un archivo a un producto y se lo haga llegar al cliente de forma fiable en cuanto paga, sin intervención manual.

## Funcionalidades

- Subida de un archivo digital y asociación a un producto de Shopify, desde una página dentro del propio admin embebido de la app.
- Programación de una fecha de liberación opcional por archivo (el producto puede comprarse ya, pero el archivo no se libera hasta la fecha indicada).
- Detección automática de pedidos pagados mediante una tarea programada (cron) que consulta la Admin API cada 2 minutos, sin depender del webhook `orders/paid`.
- Entrega del archivo por email al comprador, con un enlace de descarga seguro generado con un token único e impredecible por pedido (no expone IDs internos ni el archivo en bruto).
- Control de idempotencia: cada pedido se marca como entregado solo tras confirmar el envío del email, para evitar duplicados y permitir reintentos automáticos si algo falla.

## Stack

- [React Router](https://reactrouter.com/) (Remix) sobre [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Prisma](https://www.prisma.io/) ORM, con SQLite en desarrollo
- Node.js
- [node-cron](https://www.npmjs.com/package/node-cron) para la tarea programada
- [Resend](https://resend.com/) para el envío de emails transaccionales

## Decisiones de arquitectura

**Polling en vez de webhook `orders/paid`:** durante el desarrollo, revisar activamente los pedidos pagados evita depender de la aprobación de "Protected Customer Data" que exige Shopify antes de publicar la app (necesaria en cualquier caso antes de publicarla con tiendas reales, se use webhook o API). Como ventaja añadida, si el servidor se cae unos minutos, no se pierde ningún pedido: al reiniciar, el propio revisor vuelve a comprobar los últimos pedidos pagados.

**Enlaces de descarga con token, no con almacenamiento en la nube:** en vez de exponer el archivo con una URL predecible, cada entrega genera un token aleatorio (`crypto.randomUUID()`) que se valida contra la base de datos antes de servir el archivo. Esto deja preparado el cambio futuro a un storage externo (S3, etc.) sin tener que tocar el resto del flujo — solo cambiaría cómo la ruta de descarga obtiene el archivo internamente.

## Instalación

```shell
npm install
cp .env.example .env
# rellena las variables en .env (ver más abajo)
npm run setup      # prisma generate + prisma migrate deploy
npm run dev        # shopify app dev
```

Pulsa `p` en la terminal para abrir la app en tu tienda de desarrollo.

## Variables de entorno

Ver `.env.example` para la lista completa. Necesitas, como mínimo:

- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` — credenciales de tu app en el Partner Dashboard
- `SCOPES` — permisos de la app
- `SHOPIFY_APP_URL` — URL pública de la app (la genera automáticamente el túnel de Shopify CLI en desarrollo)
- `RESEND_API_KEY` — clave de API de Resend para el envío de emails

## Mejoras pendientes

- Expiración de los enlaces de descarga.
- Nombres de archivo únicos en `/uploads` para evitar colisiones entre productos distintos.
- Verificación de dominio propio en Resend para producción.

## Autor

Adrian Miguez