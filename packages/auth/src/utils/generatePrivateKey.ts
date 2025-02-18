import paseto from 'paseto';

const { V4 } = paseto;
const generatePrivateKey = async () => {
  return await V4.generateKey('public');
};

export default generatePrivateKey;
