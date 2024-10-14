import { chromium, FullConfig } from "@playwright/test";
import { login } from "./testHelpers";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    if (baseURL) {
      await login(page, baseURL);
    } else {
      throw new Error("`baseURL` is not defined in playwright config");
    }

    // Save signed-in state
    await context.storageState({
      path: config.projects[0].use.storageState as string,
    });
  } catch (error) {
    console.error("Error during global setup:", error);
    throw error; // Re-throw the error to fail the setup
  } finally {
    await browser.close();
  }
}

export default globalSetup;
