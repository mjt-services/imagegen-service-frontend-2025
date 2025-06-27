import { Asserts } from "@mjt-engine/assert";
import { Bytes } from "@mjt-engine/byte";
import type { ConnectionListener } from "@mjt-engine/message";
import { isUndefined } from "@mjt-engine/object";
import type { ImagegenConnectionMap, ProgressResponse } from "@mjt-services/imagegen-common-2025";
import { getEnv } from "../getEnv";


export const trackProgress = async ({
  send, signal,
}: {
  send: Parameters<
    ConnectionListener<ImagegenConnectionMap, "imagegen.txt2img">
  >[0]["send"];
  signal: AbortSignal;
}) => {
  console.log("trackProgress...");
  if (signal.aborted) {
    return;
  }
  const { IMAGEGEN_BACKEND_URL } = getEnv();
  const fullUrl = `${Asserts.assertValue(
    IMAGEGEN_BACKEND_URL
  )}/sdapi/v1/progress`;
  const resp = await fetch(fullUrl, {
    method: "GET",
    signal,
  });
  if (!resp.ok) {
    return;
  }
  const result = (await resp.json()) as ProgressResponse;
  const { eta_relative, progress, state, current_image, textinfo } = result;
  if (isUndefined(current_image)) {
    return;
  }
  const binaryImage = Bytes.base64ToArrayBuffer(current_image);

  send({
    finalized: false,
    progress,
    etaSeconds: eta_relative,
    images: [binaryImage],
    parameters: state,
    info: textinfo ?? "",
  });
};
