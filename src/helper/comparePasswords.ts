import bcrypt from 'bcrypt';

interface ComparePasswordsArgs {
  inputPassword: string;
  hash: string;
}

const comparePasswords = async (args: ComparePasswordsArgs): Promise<boolean> => {
  const { inputPassword, hash } = args;

  try {
    return await bcrypt.compare(inputPassword, hash);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export {
  comparePasswords
}
