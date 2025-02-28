import paseto from 'paseto';

const { V4 } = paseto;
const generatePrivateKey = async () => {
  const key = await V4.generateKey('public');
  return key;
};

export default generatePrivateKey;
