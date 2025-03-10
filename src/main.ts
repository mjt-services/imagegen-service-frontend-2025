import { getConnection } from "./getConnection";

// Main function to start the service
export const main = async () => {
  await getConnection();
};

