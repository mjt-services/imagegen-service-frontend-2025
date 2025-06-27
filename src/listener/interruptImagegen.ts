import { Asserts } from "@mjt-engine/assert";
import { getEnv } from "../getEnv";


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


