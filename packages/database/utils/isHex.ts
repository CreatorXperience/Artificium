const isHex = (str: string) => {
  return (
    /^[0-9A-Fa-f]+$/.test(str) && !isNaN(parseInt(str, 16)) && str.length === 16
  );
};

export default isHex;
