import { Messages } from "@mjt-engine/message";
import type { Env } from "./Env";

import { assertValue } from "@mjt-engine/assert";
import type { DataConnectionMap } from "@mjt-services/data-common-2025";
import type { ImagegenConnectionMap } from "@mjt-services/imagegen-common-2025";
import { getEnv } from "./getEnv";
import { imagegenGetLorasListener } from "./listener/imagegenGetLoras";
import { imagegenGetModelsListener } from "./listener/imagegenGetModels";
import { imagegenTxt2ImgListener } from "./listener/imagegenTxt2ImgListener";

export const initConnection = async () => {
  const env = getEnv();
  const url = assertValue(env.NATS_URL);
  console.log("NATS_URL", url);

  const con = await Messages.createConnection<
    DataConnectionMap & ImagegenConnectionMap,
    Env
  >({
    subscribers: {
      "imagegen.txt2img": imagegenTxt2ImgListener,
      "imagegen.getLoras": imagegenGetLorasListener,
      "imagegen.getModels": imagegenGetModelsListener, // Assuming this is the same as getLoras
    },
    options: { log: console.log },
    server: [url],
    token: env.NATS_AUTH_TOKEN,
    env,
  });
  console.log("initConnection: init complete");
  return con;
};
