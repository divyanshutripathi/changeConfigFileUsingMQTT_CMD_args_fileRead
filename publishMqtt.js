// file for publishing a message and recieving a message to test the tool
var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", function () {
  console.log("connected");
  client.subscribe("/module/config");
  const options = {
    retain: true,
    qos: 1,
  };
  client.publish("module/config/param/mqtt_host", "hivemq", options);
  //   client.end();
});

client.on("message", function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  client.end();
});
