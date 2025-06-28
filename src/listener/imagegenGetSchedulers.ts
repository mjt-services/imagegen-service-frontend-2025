import { Asserts } from "@mjt-engine/assert";
import { Errors } from "@mjt-engine/error";
import { type ConnectionListener } from "@mjt-engine/message";
import type {
  components,
  ImagegenConnectionMap,
} from "@mjt-services/imagegen-common-2025";
import { getEnv } from "../getEnv";

export const imagegenGetSchedulersListener: ConnectionListener<
  ImagegenConnectionMap,
  "imagegen.getSchedulers"
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
    )}/sdapi/v1/schedulers`;
    const resp = await fetch(fullUrl, {
      signal,
      method: "GET",
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
    const respBody =
      (await resp.json()) as components["schemas"]["SchedulerItem"][];
    for (const item of respBody) {
      send(item);
    }
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
