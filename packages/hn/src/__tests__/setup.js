fakeConsoleMethod = jest.fn(message => {
  throw new Error(message);
});

beforeAll(() => {
  global.console.log = global.console.warn = global.console.error = fakeConsoleMethod;
});
