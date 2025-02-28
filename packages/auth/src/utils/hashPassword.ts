import bcrypt from 'bcryptjs';
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, await bcrypt.genSalt(10));
};

export default hashPassword;
