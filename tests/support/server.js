var fetchMock = require('fetch-mock');

fetchMock.get('http://headless.ninja/tests/hn?_format=hn&path=%2Ftest123', require('./response-1.json'));