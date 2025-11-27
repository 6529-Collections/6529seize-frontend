// Server-only entrypoint for Alchemy helpers; used by API routes and server utilities.
if (typeof window !== "undefined") {
  throw new Error("Alchemy services must be used server-side");
}

export * from "./alchemy";
