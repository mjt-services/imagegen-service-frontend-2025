import { Errors, type ConnectionListener } from "@mjt-engine/message";
import type {
  ImagegenConnectionMap,
  ImageResponse,
  ImageToImageRequest,
} from "@mjt-services/imagegen-common-2025";
import { getEnv } from "../getEnv";
import { Asserts } from "@mjt-engine/assert";
import { Bytes } from "@mjt-engine/byte";

export const imagegenTxt2ImgListener: ConnectionListener<
  ImagegenConnectionMap,
  "imagegen.txt2img"
> = async (props) => {
  console.log("imagegenTxt2ImgListener", props.detail.body);
  const { detail, send, signal } = props;
  const { IMAGEGEN_BACKEND_URL } = getEnv();
  const fullUrl = `${Asserts.assertValue(
    IMAGEGEN_BACKEND_URL
  )}/sdapi/v1/txt2img`;
  const resp = await fetch(fullUrl, {
    method: "POST",
    body: JSON.stringify(detail.body),
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("imagegenTxt2ImgListener: response", resp);
  if (!resp.ok) {
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
};
