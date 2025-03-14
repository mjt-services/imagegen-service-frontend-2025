import { Asserts } from "@mjt-engine/assert";
import { Bytes } from "@mjt-engine/byte";
import { Errors, type ConnectionListener } from "@mjt-engine/message";
import { isDefined, isUndefined } from "@mjt-engine/object";
import type {
  ImagegenConnectionMap,
  ImageResponse,
  ProgressResponse,
} from "@mjt-services/imagegen-common-2025";
import { getEnv } from "../getEnv";

export const imagegenTxt2ImgListener: ConnectionListener<
  ImagegenConnectionMap,
  "imagegen.txt2img"
> = async (props) => {
  console.log("imagegenTxt2ImgListener", props.detail.body);
  const { detail, send, signal } = props;
  const { IMAGEGEN_BACKEND_URL } = getEnv();
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
  } finally {
    signal.removeEventListener("abort", abortListener);
    if (isDefined(trackIntervalId)) {
      clearInterval(trackIntervalId);
    }
  }
};

export const interruptImagegen = async () => {
  const { IMAGEGEN_BACKEND_URL } = getEnv();
  const fullUrl = `${Asserts.assertValue(
    IMAGEGEN_BACKEND_URL
  )}/sdapi/v1/interrupt`;

  const resp = await fetch(fullUrl, {
    method: "POST",
  });
  if (resp.ok) {
    console.log("Interrupted");
    if (resp.body) {
      console.log(await resp.text());
    }
  } else {
    console.log("Failed to interrupt");
    if (resp.body) {
      console.log(await resp.text());
    }
  }
};

export const trackProgress = async ({
  send,
  signal,
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
