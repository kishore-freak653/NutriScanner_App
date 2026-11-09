export const validationError = (message) => {
  const error = new Error(message);
  error.name = "ValidationError";
  return error;
};
