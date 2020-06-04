const R = require("ramda");
const fs = require("fs");
const mqtt = require("mqtt");

var client = mqtt.connect("mqtt://broker.hivemq.com");

const topicInitials = "module/config/param/";

// connected MQTT
client.on("connect", () => {
  console.log("mqtt broker connected");
  // subscribed to the topics
  client.subscribe(`${topicInitials}mqtt_client_id`);
  client.subscribe(`${topicInitials}mqtt_port`);
  client.subscribe(`${topicInitials}mqtt_host`);
  client.subscribe(`${topicInitials}verbosity`);
  client.subscribe(`${topicInitials}config_file`);
});

// extracting the command line variables
var myArgs = process.argv.slice(2);

// reading the confif file
const data = fs.readFileSync("config.json", "utf-8");
const file = JSON.parse(data);

// initialising the keys that are there on the file
const arrConfigKey = [
  "mqtt_client_id",
  "mqtt_port",
  "mqtt_host",
  "verbosity",
  "config_file",
  "C",
  "p",
  "h",
  "v",
  "c",
];

// function where the execution is done
async function execution() {
  let updatedFile = file;
  // calling the MQTT function first if no argument are sent form the terminal
  if (!myArgs.length) {
    await MqttConf(updatedFile);
  }
  // cehcking if the command line arguments are present or not
  if (myArgs.length) {
    await terminalConf(updatedFile);
  }
  // checking if the service file is present or not on the location mentioned in config file
  if (!fs.existsSync(file.config_file)) {
    process.exit();
  }
  // executing the data present in config file
  if (fs.existsSync(file.config_file)) {
    await fileConfig(file);
  }
}

// function for data in service file
function fileConfig(file) {
  const fileData = JSON.parse(fs.readFileSync("service.json", "utf-8"));
  const updatedFile = Object.assign(file, fileData);
  fs.writeFileSync("config.json", JSON.stringify(updatedFile));
}

// function for data in arguments
function terminalConf(updatedFile) {
  if (myArgs[0] && !arrConfigKey.includes(myArgs[0])) {
    console.error(`Error: Parameter ${myArgs[0]} is not a standard option`);
    process.exit();
  }
  const mqttClientId =
    R.indexOf("mqtt_client_id", myArgs) !== -1
      ? R.indexOf("mqtt_client_id", myArgs)
      : R.indexOf("C", myArgs) !== -1
      ? R.indexOf("C", myArgs)
      : -1;
  const mqttPort =
    R.indexOf("mqtt_port", myArgs) !== -1
      ? R.indexOf("mqtt_port", myArgs)
      : R.indexOf("p", myArgs) !== -1
      ? R.indexOf("p", myArgs)
      : -1;
  const mqttHost =
    R.indexOf("mqtt_host", myArgs) !== -1
      ? R.indexOf("mqtt_host", myArgs)
      : R.indexOf("h", myArgs) !== -1
      ? R.indexOf("h", myArgs)
      : -1;
  const verbosity =
    R.indexOf("verbosity", myArgs) !== -1
      ? R.indexOf("verbosity", myArgs)
      : R.indexOf("v", myArgs) !== -1
      ? R.indexOf("v", myArgs)
      : -1;
  const configFile =
    R.indexOf("config_file", myArgs) !== -1
      ? R.indexOf("config_file", myArgs)
      : R.indexOf("c", myArgs) !== -1
      ? R.indexOf("c", myArgs)
      : -1;

  if (mqttClientId !== -1) {
    updatedFile = { ...updatedFile, mqtt_client_id: myArgs[mqttClientId + 1] };
  }
  if (mqttPort !== -1) {
    updatedFile = { ...updatedFile, mqtt_port: myArgs[mqttPort + 1] };
  }
  if (mqttHost !== -1) {
    updatedFile = { ...updatedFile, mqtt_host: myArgs[mqttHost + 1] };
  }
  if (verbosity !== -1) {
    updatedFile = { ...updatedFile, verbosity: myArgs[verbosity + 1] };
  }
  if (configFile !== -1) {
    updatedFile = { ...updatedFile, config_file: myArgs[configFile + 1] };
  }

  fs.writeFileSync("config.json", JSON.stringify(updatedFile));
  process.exit();
}

// function from data coming form mqtt
function MqttConf(updatedFile) {
  client.on("message", function (topic, message) {
    // message is Buffer
    if (topic === `${topicInitials}mqtt_client_id`) {
      updatedFile = { ...updatedFile, mqtt_client_id: message.toString() };
      fs.writeFileSync("config.json", JSON.stringify(updatedFile));
    }
    if (topic === `${topicInitials}mqtt_port`) {
      updatedFile = { ...updatedFile, mqtt_port: message.toString() };
      fs.writeFileSync("config.json", JSON.stringify(updatedFile));
    }
    if (topic === `${topicInitials}mqtt_host`) {
      updatedFile = { ...updatedFile, mqtt_host: message.toString() };
      fs.writeFileSync("config.json", JSON.stringify(updatedFile));
    }
    if (topic === `${topicInitials}verbosity`) {
      updatedFile = { ...updatedFile, verbosity: message.toString() };
      fs.writeFileSync("config.json", JSON.stringify(updatedFile));
    }
    if (topic === `${topicInitials}config_file`) {
      updatedFile = { ...updatedFile, config_file: message.toString() };
      fs.writeFileSync("config.json", JSON.stringify(updatedFile));
    }
    const options = {
      retain: true,
      qos: 1,
    };
    client.publish("/module/config", JSON.stringify(updatedFile), options);
  });
  setTimeout(() => {
    client.end();
    process.exit();
  }, 5000);
}

// calling of the execution function
execution();
