/**
 * Generates a random numerical OTP of a specified length.
 * @param length The length of the OTP (default is 6).
 * @returns A string representing the OTP.
 */
const generateRandomOTP = (length: number = 6): string => {
  // Calculate the maximum number possible for the given length (e.g., for length 6, max is 1,000,000)
  const max = Math.pow(10, length);

  // Generate a random number and use Math.floor to get an integer
  const randomNumber = Math.floor(Math.random() * max);

  // Convert to string and pad with leading zeros if necessary
  return `${randomNumber}`.padStart(length, '0');
}

export {
  generateRandomOTP
}