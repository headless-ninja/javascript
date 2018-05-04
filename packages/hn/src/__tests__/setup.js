global.console.log = global.console.warn = global.console.error = jest.fn(
  message => {
    throw new Error(message);
  },
);
