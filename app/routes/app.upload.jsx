import { useState } from "react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getProducts {
      products(first: 50) {
        edges {
          node {
            id
            title
          }
        }
      }
    }`
  );

  const data = await response.json();
  const products = data.data.products.edges.map((edge) => edge.node);

  return { products };
};

export default function UploadPage() {
  const { products } = useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData(event.target);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Error de red al subir el archivo" });
    }

    setIsSubmitting(false);
  };

  return (
    <s-page heading="Subir archivo digital">
      <s-section heading="Nuevo archivo">
        <form onSubmit={handleSubmit}>
          <s-stack gap="base">
            <s-select label="Producto" name="productId" required>
              <s-option value="">Selecciona un producto</s-option>
              {products.map((product) => (
                <s-option key={product.id} value={product.id}>
                  {product.title}
                </s-option>
              ))}
            </s-select>

            <s-text-field
              label="Fecha de liberación (opcional)"
              name="releaseDate"
              type="date"
            />

            <input type="file" name="file" required />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Subiendo..." : "Guardar archivo"}
            </button>
          </s-stack>
        </form>

        {result?.success && (
          <s-paragraph>Archivo guardado correctamente.</s-paragraph>
        )}
        {result?.error && (
          <s-paragraph>{result.error}</s-paragraph>
        )}
      </s-section>
    </s-page>
  );
}