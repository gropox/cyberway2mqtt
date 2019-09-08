FROM node:current-slim

ENV workdir /opt/cyber2mqtt/

WORKDIR ${workdir}  
ADD . $workdir

RUN yarn install
#RUN ln -s /etc/cyber2mqtt/config.json5

CMD [ "node", "index.js", "debug" ]
