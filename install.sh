#!/bin/sh
if [ -n "$1" ] ; then
  node=$1
else
  node="127.0.0.1:8098"
fi
if [ -n "$2" ] ; then
  bucket=$2
else
  bucket="vault"
fi
curl -v -X PUT -T jquery.js -H "Content-type: text/javascript" http://$node/riak/$bucket/jquery.js
curl -v -X PUT -T riak.js -H "Content-type: text/javascript" http://$node/riak/$bucket/riak.js
curl -v -X PUT -T json2.js -H "Content-type: text/javascript" http://$node/riak/$bucket/json2.js
curl -v -X PUT -T gibberish-aes.min.js -H "Content-type: text/javascript" http://$node/riak/$bucket/gibberish-aes.min.js
curl -v -X PUT -T microjungle.min.js -H "Content-type: text/javascript" http://$node/riak/$bucket/microjungle.min.js
curl -v -X PUT -T SS.min.js -H "Content-type: text/javascript" http://$node/riak/$bucket/SS.min.js
curl -v -X PUT -T vault.js -H "Content-type: text/javascript" http://$node/riak/$bucket/vault.js
curl -v -X PUT -T index.html -H "Content-type: text/html" http://$node/riak/$bucket/index.html
curl -v -X PUT -T vault.css -H "Content-type: text/html" http://$node/riak/$bucket/vault.css
