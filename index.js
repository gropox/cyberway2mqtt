const global = require("basescript");
const log = global.getLogger("steam_index");

global.initApp("cyberway2mqtt");

const CONFIG = global.CONFIG;

const net = require("net");

var mqtt = require('mqtt')
var mqtt_client = null;

async function run() {


    log.info("waiting 5s for others");
    await global.sleep(5000);

    log.info("start adapter on", CONFIG.mqtt);
    mqtt_client  = mqtt.connect(CONFIG.mqtt)

    let buffer = "";

    mqtt_client.on('connect', function () {

        log.info("mqtt ready");

        var client = net.createConnection(CONFIG.socket);
        client.setEncoding("UTF-8");


        client.on("connect", function() {
            log.info("connected");
        });

        client.on("data", function(data) {
            const inp = data.split(/\n/);
            if(1 == inp.length) {
                buffer += inp[0];
            } else {
                for(let i = 0; i < inp.length-1; i++) {
                    const part = inp[i];
                    if(!part && buffer) {
                        processMessage(buffer);
                    } else {
                        processMessage(buffer + part);
                    }
                    buffer = "";
                }
                buffer = inp[inp.length-1];
            }
        });

        client.on("error", function(err) {
            log.error("got mqtt error", err);
            throw err;
        });
    });
}

function processMessage(message) {
    try {
        const data = JSON.parse(message);
        const {msg_type, prod_block_id, block_num, block_time, id} = data;

        //log.info("send message to", data.msg_type);
        mqtt_client.publish(msg_type, message);

        if(msg_type == "ApplyTrx" && prod_block_id) {
            for(let action of data.actions) {
                const topic = `actions/${action.receiver}/${action.code}/${action.action}`;
                mqtt_client.publish(topic, JSON.stringify({prod_block_id, block_num, block_time, id, ...action}));
            }
        }
    } catch(e) {
        log.error("unrecognized message", e);
    }
}

run();