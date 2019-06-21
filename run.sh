#!/bin/sh

IP=$IP

echo "IP:$IP"

sed -i s/127.0.0.1/${IP}/g /usr/share/nginx/html/setting.js \
  && sed -i s/localhost/${IP}/g /usr/share/nginx/html/setting.js

nginx -g "daemon off;"