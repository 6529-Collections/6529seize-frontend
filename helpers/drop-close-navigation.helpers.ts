export const DROP_CLOSE_COOKIE_NAME = "drop_close";
const DROP_CLOSE_COOKIE_MAX_AGE_SECONDS = 5;

export const markDropCloseNavigation = () => {
  globalThis.document.cookie = `${DROP_CLOSE_COOKIE_NAME}=1; Max-Age=${DROP_CLOSE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
};
