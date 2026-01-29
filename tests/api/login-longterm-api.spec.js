import { expect, test } from "@playwright/test";

test("should able to login via api", async ({ request }) => {
  const resp = await request.post(
    "https://api-web-demo.qahive.com/auth/login",
    {
      data: {
        email: "demo@demo.com",
        password: "Welcome1",
      },
    }
  );

  await expect(resp).toBeOK();
  expect((await resp.json()).access_token).not.toBeNull();
});