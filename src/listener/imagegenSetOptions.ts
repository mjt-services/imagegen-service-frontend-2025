import { Asserts } from "@mjt-engine/assert";
import { Errors } from "@mjt-engine/error";
import { type ConnectionListener } from "@mjt-engine/message";
import type {
  components,
  ImagegenConnectionMap,
} from "@mjt-services/imagegen-common-2025";
import { getEnv } from "../getEnv";

export const imagegenSetOptionsListener: ConnectionListener<
  ImagegenConnectionMap,
  "imagegen.setOptions"
> = async (props) => {
  const { detail, send, signal } = props;
  const { IMAGEGEN_BACKEND_URL } = getEnv();
  const abortListener = async () => {
    console.log("Aborted!!!");
  };
  try {
    if (signal.aborted) {
      console.warn("Signal already aborted, exiting early.");
      return;
    }
    signal.addEventListener("abort", abortListener);
    const fullUrl = `${Asserts.assertValue(
      IMAGEGEN_BACKEND_URL
    )}/sdapi/v1/options`;
    const resp = await fetch(fullUrl, {
      signal,
      method: "POST",
      body: JSON.stringify(detail.body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (signal.aborted) {
      return;
    }

    if (!resp.ok) {
      console.error(
        `Failed to fetch from: ${fullUrl}`,
        resp.status,
        resp.statusText
      );
      throw Errors.errorToErrorDetail({
        error: new Error(`Failed to fetch from: ${fullUrl}`),
        extra: [detail],
      });
    }
    const respBody = await resp.json();

    send(respBody);
  } catch (error) {
    console.error("Error in imagegenTxt2ImgListener:", error);
    throw Errors.errorToErrorDetail({
      error: error,
      extra: [detail],
    });
  } finally {
    signal.removeEventListener("abort", abortListener);
  }
};
