import { Asserts } from "@mjt-engine/assert";
import { Bytes } from "@mjt-engine/byte";
import { type ConnectionListener } from "@mjt-engine/message";
import { isDefined } from "@mjt-engine/object";
import type {
  ImagegenConnectionMap,
  ImageResponse,
} from "@mjt-services/imagegen-common-2025";
import { getEnv } from "../getEnv";
import { interruptImagegen } from "./interruptImagegen";
import { trackProgress } from "./trackProgress";
import { Errors } from "@mjt-engine/error";

export const imagegenTxt2ImgListener: ConnectionListener<
  ImagegenConnectionMap,
  "imagegen.txt2img"
> = async (props) => {
  console.log("imagegenTxt2ImgListener", props.detail.body);
  const { detail, send, signal } = props;
  const { IMAGEGEN_BACKEND_URL } = getEnv();
  console.log("imagegenTxt2ImgListener backend URL:", IMAGEGEN_BACKEND_URL);
  let trackIntervalId: NodeJS.Timeout | undefined = undefined;
  const abortListener = async () => {
    console.log("Aborted!!!");
    send({
      aborted: true,
      images: [],
      info: "Aborted",
      parameters: {},
    });
    await interruptImagegen();
  };
  try {
    if (signal.aborted) {
      console.warn("Signal already aborted, exiting early.");
      return;
    }
    signal.addEventListener("abort", abortListener);
    trackIntervalId = setInterval(() => {
      trackProgress({ send, signal });
    }, 3000);
    const fullUrl = `${Asserts.assertValue(
      IMAGEGEN_BACKEND_URL
    )}/sdapi/v1/txt2img`;
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
        extra: [detail.body],
      });
    }
    const respBody = (await resp.json()) as ImageResponse;
    const { images, ...rest } = respBody;
    const binaryImages = images.map((base64) =>
      Bytes.base64ToArrayBuffer(base64)
    );

    send({
      images: binaryImages,
      finalized: true,
      ...rest,
    });
  } catch (error) {
    console.error("Error in imagegenTxt2ImgListener:", error);
    throw Errors.errorToErrorDetail({
      error: error,
      extra: [detail.body],
    });
  } finally {
    signal.removeEventListener("abort", abortListener);
    if (isDefined(trackIntervalId)) {
      clearInterval(trackIntervalId);
    }
  }
};
