import { E2eeApiError } from "@/lib/e2ee/api-errors";
import { errorMessage, E2EE_SESSION_EXPIRED } from "@/lib/e2ee/engine/errors";

it("distinguishes a rejected session from encryption device failures", () => {
  expect(
    errorMessage(new E2eeApiError({ status: 401, message: "Unauthorized" }))
  ).toBe(E2EE_SESSION_EXPIRED);
  expect(
    errorMessage(
      new E2eeApiError({ status: 403, message: "E2EE_NOT_YOUR_DEVICE" })
    )
  ).toBe("E2EE_NOT_YOUR_DEVICE");
});
