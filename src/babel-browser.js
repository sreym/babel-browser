import * as Babel from './index';

var jsxControlStatements = require('jsx-control-statements/babel');

let transformOptions = {
  presets: ['es2015', 'react', 'stage-0'],
  plugins: [jsxControlStatements]
};

let runCode = function (code, opts = {}) {
  opts.sourceMaps = "inline";
  return new Function(Babel.transform(code, opts).code)();
};

/**
 * Load scripts via xhr, and `transform` when complete (optional).
 */

let loadScript = function (url, callback, opts = {}, hold) {
  opts.filename = opts.filename || url;

  var xhr = global.ActiveXObject ? new global.ActiveXObject("Microsoft.XMLHTTP") : new global.XMLHttpRequest();
  xhr.open("GET", url, true);
  if ("overrideMimeType" in xhr) xhr.overrideMimeType("text/plain");

  /**
   * When successfully loaded, transform (optional), and call `callback`.
   */

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;

    var status = xhr.status;
    if (status === 0 || status === 200) {
      var param = [xhr.responseText, opts];
      if (!hold) runCode.apply(Babel.transform, param);
      if (callback) callback(param);
    } else {
      throw new Error(`Could not load ${url}`);
    }
  };

  xhr.send(null);
};

function runScripts() {
  var scripts = [];
  var types   = ["text/ecmascript-6", "text/6to5", "text/babel", "module"];
  var index   = 0;

  /**
   * Transform and execute script. Ensures correct load order.
   */

  var exec = function () {
    var param = scripts[index];
    if (param instanceof Array) {
      runCode.apply(Babel.transform, param);
      index++;
      exec();
    }
  };

  /**
   * Load, transform, and execute all scripts.
   */

  var run = function (script, i) {
    var opts = transformOptions;

    if (script.src) {
      loadScript(script.src, function (param) {
        scripts[i] = param;
        exec();
      }, opts, true);
    } else {
      opts.filename = "embedded";
      scripts[i] = [script.innerHTML, opts];
    }
  };

  // Collect scripts with Babel `types`.

  var _scripts = global.document.getElementsByTagName("script");

  for (var i = 0; i < _scripts.length; ++i) {
    var _script = _scripts[i];
    if (types.indexOf(_script.type) >= 0) scripts.push(_script);
  }

  for (i in scripts) {
    run(scripts[i], i);
  }

  exec();
}

if (global.addEventListener) {
  global.addEventListener("DOMContentLoaded", runScripts, false);
} else if (global.attachEvent) {
  global.attachEvent("onload", runScripts);
}

export {Babel as default, transformOptions as options};