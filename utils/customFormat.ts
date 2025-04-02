import winston from 'winston';
import color from 'ansi-colors';
const customFormat = winston.format.printf(
  ({ level, message, stack, timestamp }) => {
    const levelColor = {
      error: color.red.bold,
      warn: color.yellow.bold,
      info: color.cyan.bold,
      debug: color.green.bold,
    };

    const logLevel = levelColor[level]
      ? levelColor[level](level.toUpperCase())
      : level.toUpperCase();
    const time = color.gray(`[${timestamp}]`);

    return stack
      ? `${time} ${logLevel}: ${color.redBright(
          message as string
        )}\n${color.gray(stack as string)}` // Stack trace for errors
      : `${time} ${logLevel}: ${message}`;
  }
);

export default customFormat;
