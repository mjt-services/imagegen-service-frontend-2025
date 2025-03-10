import { Asserts } from "@mjt-engine/assert";
import { initConnection } from "./initConnection";

let _connection: Awaited<ReturnType<typeof initConnection>> | undefined;

export const getConnection = async () => {
  if (!_connection) {
    _connection = await initConnection();
  }
  return Asserts.assertValue(_connection);
};
