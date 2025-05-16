import bcrypt from 'bcrypt';

const hash = async (password: string) => {
  try {
    const saltRounds = 10;

    const salt = await bcrypt.genSalt(saltRounds);

    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error(error);

    throw error;
  }
};

export {
  hash
}
