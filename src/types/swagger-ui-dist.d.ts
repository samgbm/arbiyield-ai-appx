declare module "swagger-ui-dist/swagger-ui-es-bundle.js" {
  type SwaggerUIBundle = (options: {
    domNode?: HTMLElement;
    dom_id?: string;
    url?: string;
    spec?: object;
    docExpansion?: string;
    defaultModelsExpandDepth?: number;
  }) => unknown;

  const SwaggerUIBundle: SwaggerUIBundle;
  export default SwaggerUIBundle;
}

declare module "swagger-ui-dist/swagger-ui.css";
