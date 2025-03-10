import type { Env } from "./Env";


export const getEnv = () => {
  return process.env as Env;
};
