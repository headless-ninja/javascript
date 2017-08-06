var test = require('tape');
var hn = require('../../src');

test('creating a site', function(t){

  t.plan(2);

  var site = new hn.Site({ url: 'http://localhost:8088' });
  t.ok(site instanceof hn.Site);
  t.equal(typeof site.getPage, 'function');

});
