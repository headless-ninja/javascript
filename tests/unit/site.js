var test = require('tape');
var hn = require('../../src');

require('../support/server');

/**
 * @type { Site }
 */
var site;

test('creating a site', function(t){

  t.plan(2);

  site = new hn.Site({ url: 'http://headless.ninja/tests' });
  t.ok(site instanceof hn.Site);
  t.equal(typeof site.getPage, 'function');

});

test('getting a page', function(t){

  t.plan(2);

  site.getPage('/test123').then(function(entityUUID) {
    t.equal(entityUUID, 'e3842f1c-e148-46ae-a3e8-c03badbcb05b');
    t.equal(site.getData(entityUUID).body.value, 'This is a body');
  }).catch(function(error) {
    console.error(error);
  });

});