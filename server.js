/* eslint-disable: no-console */
const talkback = require("talkback");
const path = require("path");
const configs = require("./configs.json");

// https://github.com/ijpiantanida/talkback#recording-modes
const MODES = {
  record: talkback.Options.RecordMode.NEW,
  r: talkback.Options.RecordMode.NEW,
  overwrite: talkback.Options.RecordMode.OVERWRITE,
  o: talkback.Options.RecordMode.OVERWRITE,
  disabled: talkback.Options.RecordMode.DISABLED,
  d: talkback.Options.RecordMode.DISABLED,
};

const recordMode = MODES[process.env.RECORD_MODE] || MODES.disabled;

const { ...rest } = configs;
const tapesPath = path.resolve(`./${configs.tapes_folder}`);

const host = process.env.API_URL || configs.api_url;
const port = process.env.PORT || configs.port;
const pathToTapes = process.env.TAPES_PATH || tapesPath;
const silent = Boolean(process.env.CI_ENVIRONMENT);

const opts = {
  ...rest,
  host,
  port,
  path: pathToTapes,
  record: recordMode,
  silent,
  allowHeaders: [],

  fallbackMode: () => {
    if (process.env.CI_ENVIRONMENT) {
      return talkback.Options.FallbackMode.NOT_FOUND;
    }
    return talkback.Options.FallbackMode.PROXY;
  },

  responseDecorator: (tape) => {
    if (
      tape.res.headers["Access-Control-Allow-Origin"] ||
      tape.res.headers["access-control-allow-origin"]
    ) {
      return tape;
    }

    tape.res.headers["Access-Control-Allow-Origin"] = "*";
    tape.res.headers["Access-Control-Allow-Methods"] =
      "GET, POST, PUT, OPTIONS";

    return tape;
  },
};

const server = talkback(opts);
server
  .start(() => {
    console.log("------------");
    console.log("Record mode:", recordMode);
    console.log(
      "Use `RECORD_MODE={mode}` env variable to change the record mode. Options",
      Object.keys(MODES)
    );
    console.log("------------");
    console.log("Using the tapes stored in: ", pathToTapes);
    console.log("------------");
    console.log(`Proxying requests to ${host}`);
    console.log(`Proxy listening on http://localhost:${port}`);
    console.log("Use `CI_ENVIRONMENT=1` to isolated tests.");
    if (silent) {
      console.log("Running in silent and isolated mode.");
    }
  })
  .then((httpServer) => {
    httpServer.on("request", (req, res) => {
      // Set CORS headers
      if (req.method === "OPTIONS") {
        res
          .writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Request-Method": "*",
            "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
            "Access-Control-Allow-Headers": "*",
          })
          .end();
        return;
      }
    });
  });
