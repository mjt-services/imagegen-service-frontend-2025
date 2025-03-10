import type { ConnectionListener } from "@mjt-engine/message";
import type { ImagegenConnectionMap } from "@mjt-services/imagegen-common-2025";

export const imagegenTxt2ImgListener: ConnectionListener<
  ImagegenConnectionMap,
  "imagegen.txt2img"
> = async (props) => {
  console.log("imagegenTxt2ImgListener", props.detail.body);
};
