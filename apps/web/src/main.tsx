import { RouterProvider, createRouter } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { NuqsProvider } from "./providers/nuqs";
import { ReactQueryProvider } from "./providers/react-query";
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ReactQueryProvider>
        <NuqsProvider>
          <RouterProvider router={router} />
        </NuqsProvider>
      </ReactQueryProvider>
    </React.StrictMode>,
  );
}
