export const verifyEnvVariable = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} variable is undefined or empty`);
  }

  return value;
};
