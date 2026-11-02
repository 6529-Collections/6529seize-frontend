/**
 * The class a row or block carries to fold on a phone inside `PhoneMore`.
 * A plain module, not the client component's: a server component that
 * imports a value from a "use client" file gets a client reference, not
 * the string.
 */
export const PHONE_MORE_HIDDEN = "max-md:group-[:not(.is-open)]/more:tw-hidden";
