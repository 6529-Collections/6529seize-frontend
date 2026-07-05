/**
 * Download view selector for community metrics downloads.
 *
 * Lives in its own module (without "use client") so Server Components can
 * import it and pass real enum values across the RSC boundary. Importing an
 * enum from a "use client" module in a Server Component yields a client
 * reference proxy instead of the enum, so member access serializes as
 * undefined.
 */
export enum VIEW {
  CONSOLIDATION,
  WALLET,
}
