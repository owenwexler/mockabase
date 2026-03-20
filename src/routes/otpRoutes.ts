import { Hono } from "hono";
import type { AssignOTPArgs } from "../typedefs/AssignOTPArgs";
import type { VerifyOTPArgs } from "../typedefs/VerifyOTPArgs";
import type { ShowOTPResult } from "../typedefs/ShowOTPResult";
import { assignOTP, verifyOTP, clearOTP, showOTP } from "../db/models/otp";
import { mockabaseErrors } from "../data/mockabaseErrors";
import { failure, success } from "dataerror";
import type { ShowOTPArgs } from "../typedefs/ShowOTPArgs";

const otpRoutes = new Hono();

otpRoutes.post('/assign-otp', async (c) => {
  console.log('POST /otp/assign-otp');
  const body = await c.req.json();

  const args = body ? body as AssignOTPArgs : null;

  if (!args) {
    const result = await failure<'ok'>(mockabaseErrors.missingInputs, 'routes/otp/assign-otp');

    return c.json(result);
  }

  try {
    const response = await assignOTP(args!);

    if (response.error) {
      const result = await failure<'ok'>(response.error, 'routes/otp/assign-otp');
      return c.json(result);
    }

    const result = await success<'ok'>(response.data!);
    return c.json(result);
  } catch (error) {
    const result = await failure<'ok'>(error, 'routes/otp/assign-otp');
    return c.json(result);
  }
});

otpRoutes.post('/verify-otp', async (c) => {
  console.log('POST /otp/verify-otp');
  const body = await c.req.json();

  const args = body ? body as VerifyOTPArgs : null;

  if (!args) {
    const result = await failure<'ok'>(mockabaseErrors.missingInputs, 'routes/otp/verify-otp');
    return c.json(result);
  }

  try {
    const response = await verifyOTP(args!);

    if (response.error) {
      const result = await failure<'ok'>(response.error, 'routes/otp/verify-otp');
      return c.json(result);
    }

    const result = await success<'ok'>(response.data!);
    return c.json(result);
  } catch (error) {
    const result = await failure<'ok'>(error, 'routes/otp/verify-otp');
    return c.json(result);
  }
});

otpRoutes.post('/clear-otp', async (c) => {
  console.log('POST /otp/clear-otp');
  const body = await c.req.json();

  const id: string | null = body?.id ?? null;

  if (!id) {
    const result = await failure<null>(mockabaseErrors.missingInputs, 'routes/otp/clear-otp');
    return c.json(result);
  }

  try {
    const response = await clearOTP(id);

    if (response.error) {
      const result = await failure<null>(response.error, 'routes/otp/clear-otp');
      return c.json(result);
    }

    const result = await success<null>(response.data!);
    return c.json(result);
  } catch (error) {
    const result = await failure<null>(error, 'routes/otp/clear-otp');
    return c.json(result);
  }
});

otpRoutes.post('/show-otp', async (c) => {
  console.log('POST /otp/show-otp');
  const body = await c.req.json();

  const args = body ? body as ShowOTPArgs : null;

  if (!args) {
    const result = await failure<ShowOTPResult>(mockabaseErrors.missingInputs, 'routes/otp/show-otp');
    return c.json(result);
  }

  try {
    const response = await showOTP(args!);

    if (response!.error) {
      const result = await failure<ShowOTPResult>(response!.error, 'routes/otp/show-otp');
      return c.json(result);
    }

    const result = await success<ShowOTPResult>(response!.data!);
    return c.json(result);
  } catch (error) {
    const result = await failure<ShowOTPResult>(error, 'routes/otp/show-otp');
    return c.json(result);
  }
});

export {
  otpRoutes
}