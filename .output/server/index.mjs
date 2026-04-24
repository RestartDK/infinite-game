globalThis.__nitro_main__ = import.meta.url;
import { a as defineHandler, c as NodeResponse, l as serve, n as HTTPError, o as defineLazyEventHandler, s as toEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import "./_libs/hookable.mjs";
import { t as getContext } from "./_libs/unctx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { a as resumeWebhook, n as workflowEntrypoint, o as registerStepFunction, r as stepEntrypoint, t as dist_exports$1 } from "./_libs/@workflow/core+[...].mjs";
import "./_libs/workflow.mjs";
import "node:async_hooks";
import { dirname, resolve } from "node:path";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
//#region #nitro-vite-setup
globalThis.__nitro_vite_envs__ = {};
getContext("nitro-app", {
	asyncContext: void 0,
	AsyncLocalStorage: void 0
});
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region node_modules/.nitro/workflow/webhook.mjs
async function handler(request) {
	const pathParts = new URL(request.url).pathname.split("/");
	const token = decodeURIComponent(pathParts[pathParts.length - 1]);
	if (!token) return new Response("Missing token", { status: 400 });
	try {
		return await resumeWebhook(token, request);
	} catch (error) {
		console.error("Error during resumeWebhook", error);
		return new Response(null, { status: 404 });
	}
}
var POST$1 = handler;
//#endregion
//#region #workflow/webhook.mjs
var webhook_default = async ({ req }) => {
	try {
		return await POST$1(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
//#endregion
//#region node_modules/.nitro/workflow/steps.mjs
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: () => from[key],
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
async function __builtin_response_array_buffer() {
	return this.arrayBuffer();
}
__name(__builtin_response_array_buffer, "__builtin_response_array_buffer");
async function __builtin_response_json() {
	return this.json();
}
__name(__builtin_response_json, "__builtin_response_json");
async function __builtin_response_text() {
	return this.text();
}
__name(__builtin_response_text, "__builtin_response_text");
registerStepFunction("__builtin_response_array_buffer", __builtin_response_array_buffer);
registerStepFunction("__builtin_response_json", __builtin_response_json);
registerStepFunction("__builtin_response_text", __builtin_response_text);
async function fetch(...args) {
	return globalThis.fetch(...args);
}
__name(fetch, "fetch");
registerStepFunction("step//workflow@4.2.4//fetch", fetch);
var dist_exports = {};
__export(dist_exports, { fetch: () => fetch });
__reExport(dist_exports, dist_exports$1);
async function handleUserSignup(email) {
	throw new Error("You attempted to execute workflow handleUserSignup function directly. To start a workflow, use start(handleUserSignup) from workflow/api");
}
__name(handleUserSignup, "handleUserSignup");
handleUserSignup.workflowId = "workflow//./workflows/user-signup//handleUserSignup";
async function createUser(email) {
	console.log(`Creating user with email: ${email}`);
	return {
		id: crypto.randomUUID(),
		email
	};
}
__name(createUser, "createUser");
async function sendWelcomeEmail(user) {
	console.log(`Sending welcome email to user: ${user.id}`);
	if (Math.random() < .3) throw new Error("Retryable!");
}
__name(sendWelcomeEmail, "sendWelcomeEmail");
async function sendOnboardingEmail(user) {
	if (!user.email.includes("@")) throw new dist_exports.FatalError("Invalid email");
	console.log(`Sending onboarding email to user: ${user.id}`);
}
__name(sendOnboardingEmail, "sendOnboardingEmail");
registerStepFunction("step//./workflows/user-signup//createUser", createUser);
registerStepFunction("step//./workflows/user-signup//sendWelcomeEmail", sendWelcomeEmail);
registerStepFunction("step//./workflows/user-signup//sendOnboardingEmail", sendOnboardingEmail);
//#endregion
//#region #workflow/steps.mjs
var steps_default = async ({ req }) => {
	try {
		return await stepEntrypoint(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
var POST = workflowEntrypoint(`globalThis.__private_workflows = new Map();
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?\$/i.exec(str);
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    __name(parse, "parse");
    function fmtShort(ms2) {
      var msAbs = Math.abs(ms2);
      if (msAbs >= d) {
        return Math.round(ms2 / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms2 / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms2 / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms2 / s) + "s";
      }
      return ms2 + "ms";
    }
    __name(fmtShort, "fmtShort");
    function fmtLong(ms2) {
      var msAbs = Math.abs(ms2);
      if (msAbs >= d) {
        return plural(ms2, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms2, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms2, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms2, msAbs, s, "second");
      }
      return ms2 + " ms";
    }
    __name(fmtLong, "fmtLong");
    function plural(ms2, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
    }
    __name(plural, "plural");
  }
});

// node_modules/@workflow/utils/dist/time.js
var import_ms = __toESM(require_ms(), 1);

// node_modules/@workflow/core/dist/symbols.js
var WORKFLOW_SLEEP = /* @__PURE__ */ Symbol.for("WORKFLOW_SLEEP");

// node_modules/@workflow/core/dist/sleep.js
async function sleep(param) {
  const sleepFn = globalThis[WORKFLOW_SLEEP];
  if (!sleepFn) {
    throw new Error("\`sleep()\` can only be called inside a workflow function");
  }
  return sleepFn(param);
}
__name(sleep, "sleep");

// node_modules/workflow/dist/stdlib.js
var fetch = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//workflow@4.2.4//fetch");

// workflows/user-signup.ts
async function handleUserSignup(email) {
  const user = await createUser(email);
  await sendWelcomeEmail(user);
  await sleep("5s");
  await sendOnboardingEmail(user);
  return {
    userId: user.id,
    status: "onboarded"
  };
}
__name(handleUserSignup, "handleUserSignup");
handleUserSignup.workflowId = "workflow//./workflows/user-signup//handleUserSignup";
globalThis.__private_workflows.set("workflow//./workflows/user-signup//handleUserSignup", handleUserSignup);
var createUser = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//./workflows/user-signup//createUser");
var sendWelcomeEmail = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//./workflows/user-signup//sendWelcomeEmail");
var sendOnboardingEmail = globalThis[/* @__PURE__ */ Symbol.for("WORKFLOW_USE_STEP")]("step//./workflows/user-signup//sendOnboardingEmail");
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwgIm5vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvdXRpbHMvc3JjL3RpbWUudHMiLCAibm9kZV9tb2R1bGVzL0B3b3JrZmxvdy9jb3JlL3NyYy9zeW1ib2xzLnRzIiwgIm5vZGVfbW9kdWxlcy9Ad29ya2Zsb3cvY29yZS9zcmMvc2xlZXAudHMiLCAibm9kZV9tb2R1bGVzL3dvcmtmbG93L3NyYy9zdGRsaWIudHMiLCAid29ya2Zsb3dzL3VzZXItc2lnbnVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIEhlbHBlcnMuXG4gKi8gdmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHcgPSBkICogNztcbnZhciB5ID0gZCAqIDM2NS4yNTtcbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcGFyc2UodmFsKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcigndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICsgSlNPTi5zdHJpbmdpZnkodmFsKSk7XG59O1xuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi8gZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gICAgc3RyID0gU3RyaW5nKHN0cik7XG4gICAgaWYgKHN0ci5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbWF0Y2ggPSAvXigtPyg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8d2Vla3M/fHd8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCh0eXBlKXtcbiAgICAgICAgY2FzZSAneWVhcnMnOlxuICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgY2FzZSAneXJzJzpcbiAgICAgICAgY2FzZSAneXInOlxuICAgICAgICBjYXNlICd5JzpcbiAgICAgICAgICAgIHJldHVybiBuICogeTtcbiAgICAgICAgY2FzZSAnd2Vla3MnOlxuICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgY2FzZSAndyc6XG4gICAgICAgICAgICByZXR1cm4gbiAqIHc7XG4gICAgICAgIGNhc2UgJ2RheXMnOlxuICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgIHJldHVybiBuICogZDtcbiAgICAgICAgY2FzZSAnaG91cnMnOlxuICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgY2FzZSAnaHJzJzpcbiAgICAgICAgY2FzZSAnaHInOlxuICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICAgIHJldHVybiBuICogaDtcbiAgICAgICAgY2FzZSAnbWludXRlcyc6XG4gICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgIGNhc2UgJ21pbnMnOlxuICAgICAgICBjYXNlICdtaW4nOlxuICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgIHJldHVybiBuICogbTtcbiAgICAgICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgIGNhc2UgJ3NlY3MnOlxuICAgICAgICBjYXNlICdzZWMnOlxuICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgIHJldHVybiBuICogcztcbiAgICAgICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICAgICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgICAgICBjYXNlICdtc2Vjcyc6XG4gICAgICAgIGNhc2UgJ21zZWMnOlxuICAgICAgICBjYXNlICdtcyc6XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqLyBmdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICAgIHZhciBtc0FicyA9IE1hdGguYWJzKG1zKTtcbiAgICBpZiAobXNBYnMgPj0gZCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gaCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gbSkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICAgIH1cbiAgICBpZiAobXNBYnMgPj0gcykge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICAgIH1cbiAgICByZXR1cm4gbXMgKyAnbXMnO1xufVxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovIGZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgICB2YXIgbXNBYnMgPSBNYXRoLmFicyhtcyk7XG4gICAgaWYgKG1zQWJzID49IGQpIHtcbiAgICAgICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIGQsICdkYXknKTtcbiAgICB9XG4gICAgaWYgKG1zQWJzID49IGgpIHtcbiAgICAgICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIGgsICdob3VyJyk7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBtKSB7XG4gICAgICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gICAgfVxuICAgIGlmIChtc0FicyA+PSBzKSB7XG4gICAgICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBzLCAnc2Vjb25kJyk7XG4gICAgfVxuICAgIHJldHVybiBtcyArICcgbXMnO1xufVxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqLyBmdW5jdGlvbiBwbHVyYWwobXMsIG1zQWJzLCBuLCBuYW1lKSB7XG4gICAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG4pICsgJyAnICsgbmFtZSArIChpc1BsdXJhbCA/ICdzJyA6ICcnKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFN0cmluZ1ZhbHVlIH0gZnJvbSAnbXMnO1xuaW1wb3J0IG1zIGZyb20gJ21zJztcblxuLyoqXG4gKiBQYXJzZXMgYSBkdXJhdGlvbiBwYXJhbWV0ZXIgKHN0cmluZywgbnVtYmVyLCBvciBEYXRlKSBhbmQgcmV0dXJucyBhIERhdGUgb2JqZWN0XG4gKiByZXByZXNlbnRpbmcgd2hlbiB0aGUgZHVyYXRpb24gc2hvdWxkIGVsYXBzZS5cbiAqXG4gKiAtIEZvciBzdHJpbmdzOiBQYXJzZXMgZHVyYXRpb24gc3RyaW5ncyBsaWtlIFwiMXNcIiwgXCI1bVwiLCBcIjFoXCIsIGV0Yy4gdXNpbmcgdGhlIGBtc2AgbGlicmFyeVxuICogLSBGb3IgbnVtYmVyczogVHJlYXRzIGFzIG1pbGxpc2Vjb25kcyBmcm9tIG5vd1xuICogLSBGb3IgRGF0ZSBvYmplY3RzOiBSZXR1cm5zIHRoZSBkYXRlIGRpcmVjdGx5IChoYW5kbGVzIGJvdGggRGF0ZSBpbnN0YW5jZXMgYW5kIGRhdGUtbGlrZSBvYmplY3RzIGZyb20gZGVzZXJpYWxpemF0aW9uKVxuICpcbiAqIEBwYXJhbSBwYXJhbSAtIFRoZSBkdXJhdGlvbiBwYXJhbWV0ZXIgKFN0cmluZ1ZhbHVlLCBEYXRlLCBvciBudW1iZXIgb2YgbWlsbGlzZWNvbmRzKVxuICogQHJldHVybnMgQSBEYXRlIG9iamVjdCByZXByZXNlbnRpbmcgd2hlbiB0aGUgZHVyYXRpb24gc2hvdWxkIGVsYXBzZVxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwYXJhbWV0ZXIgaXMgaW52YWxpZCBvciBjYW5ub3QgYmUgcGFyc2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUR1cmF0aW9uVG9EYXRlKHBhcmFtOiBTdHJpbmdWYWx1ZSB8IERhdGUgfCBudW1iZXIpOiBEYXRlIHtcbiAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBkdXJhdGlvbk1zID0gbXMocGFyYW0pO1xuICAgIGlmICh0eXBlb2YgZHVyYXRpb25NcyAhPT0gJ251bWJlcicgfHwgZHVyYXRpb25NcyA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEludmFsaWQgZHVyYXRpb246IFwiJHtwYXJhbX1cIi4gRXhwZWN0ZWQgYSB2YWxpZCBkdXJhdGlvbiBzdHJpbmcgbGlrZSBcIjFzXCIsIFwiMW1cIiwgXCIxaFwiLCBldGMuYFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKERhdGUubm93KCkgKyBkdXJhdGlvbk1zKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW0gPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHBhcmFtIDwgMCB8fCAhTnVtYmVyLmlzRmluaXRlKHBhcmFtKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSW52YWxpZCBkdXJhdGlvbjogJHtwYXJhbX0uIEV4cGVjdGVkIGEgbm9uLW5lZ2F0aXZlIGZpbml0ZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLm5vdygpICsgcGFyYW0pO1xuICB9IGVsc2UgaWYgKFxuICAgIHBhcmFtIGluc3RhbmNlb2YgRGF0ZSB8fFxuICAgIChwYXJhbSAmJlxuICAgICAgdHlwZW9mIHBhcmFtID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIChwYXJhbSBhcyBhbnkpLmdldFRpbWUgPT09ICdmdW5jdGlvbicpXG4gICkge1xuICAgIC8vIEhhbmRsZSBib3RoIERhdGUgaW5zdGFuY2VzIGFuZCBkYXRlLWxpa2Ugb2JqZWN0cyAoZnJvbSBkZXNlcmlhbGl6YXRpb24pXG4gICAgcmV0dXJuIHBhcmFtIGluc3RhbmNlb2YgRGF0ZSA/IHBhcmFtIDogbmV3IERhdGUoKHBhcmFtIGFzIGFueSkuZ2V0VGltZSgpKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgSW52YWxpZCBkdXJhdGlvbiBwYXJhbWV0ZXIuIEV4cGVjdGVkIGEgZHVyYXRpb24gc3RyaW5nLCBudW1iZXIgKG1pbGxpc2Vjb25kcyksIG9yIERhdGUgb2JqZWN0LmBcbiAgICApO1xuICB9XG59XG4iLCAiZXhwb3J0IGNvbnN0IFdPUktGTE9XX1VTRV9TVEVQID0gU3ltYm9sLmZvcignV09SS0ZMT1dfVVNFX1NURVAnKTtcbmV4cG9ydCBjb25zdCBXT1JLRkxPV19DUkVBVEVfSE9PSyA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX0NSRUFURV9IT09LJyk7XG5leHBvcnQgY29uc3QgV09SS0ZMT1dfU0xFRVAgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19TTEVFUCcpO1xuZXhwb3J0IGNvbnN0IFdPUktGTE9XX0NPTlRFWFQgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19DT05URVhUJyk7XG5leHBvcnQgY29uc3QgV09SS0ZMT1dfR0VUX1NUUkVBTV9JRCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX0dFVF9TVFJFQU1fSUQnKTtcbmV4cG9ydCBjb25zdCBTVEFCTEVfVUxJRCA9IFN5bWJvbC5mb3IoJ1dPUktGTE9XX1NUQUJMRV9VTElEJyk7XG5leHBvcnQgY29uc3QgU1RSRUFNX05BTUVfU1lNQk9MID0gU3ltYm9sLmZvcignV09SS0ZMT1dfU1RSRUFNX05BTUUnKTtcbmV4cG9ydCBjb25zdCBTVFJFQU1fVFlQRV9TWU1CT0wgPSBTeW1ib2wuZm9yKCdXT1JLRkxPV19TVFJFQU1fVFlQRScpO1xuZXhwb3J0IGNvbnN0IEJPRFlfSU5JVF9TWU1CT0wgPSBTeW1ib2wuZm9yKCdCT0RZX0lOSVQnKTtcbmV4cG9ydCBjb25zdCBXRUJIT09LX1JFU1BPTlNFX1dSSVRBQkxFID0gU3ltYm9sLmZvcihcbiAgJ1dFQkhPT0tfUkVTUE9OU0VfV1JJVEFCTEUnXG4pO1xuXG4vKipcbiAqIFN5bWJvbCB1c2VkIHRvIHN0b3JlIHRoZSBjbGFzcyByZWdpc3RyeSBvbiBnbG9iYWxUaGlzIGluIHdvcmtmbG93IG1vZGUuXG4gKiBUaGlzIGFsbG93cyB0aGUgZGVzZXJpYWxpemVyIHRvIGZpbmQgY2xhc3NlcyBieSBjbGFzc0lkIGluIHRoZSBWTSBjb250ZXh0LlxuICovXG5leHBvcnQgY29uc3QgV09SS0ZMT1dfQ0xBU1NfUkVHSVNUUlkgPSBTeW1ib2wuZm9yKCd3b3JrZmxvdy1jbGFzcy1yZWdpc3RyeScpO1xuIiwgImltcG9ydCB0eXBlIHsgU3RyaW5nVmFsdWUgfSBmcm9tICdtcyc7XG5pbXBvcnQgeyBXT1JLRkxPV19TTEVFUCB9IGZyb20gJy4vc3ltYm9scy5qcyc7XG5cbi8qKlxuICogU2xlZXAgd2l0aGluIGEgd29ya2Zsb3cgZm9yIGEgZ2l2ZW4gZHVyYXRpb24uXG4gKlxuICogVGhpcyBpcyBhIGJ1aWx0LWluIHJ1bnRpbWUgZnVuY3Rpb24gdGhhdCB1c2VzIHRpbWVyIGV2ZW50cyBpbiB0aGUgZXZlbnQgbG9nLlxuICpcbiAqIEBwYXJhbSBkdXJhdGlvbiAtIFRoZSBkdXJhdGlvbiB0byBzbGVlcCBmb3IsIHRoaXMgaXMgYSBzdHJpbmcgaW4gdGhlIGZvcm1hdFxuICogb2YgYFwiMTAwMG1zXCJgLCBgXCIxc1wiYCwgYFwiMW1cImAsIGBcIjFoXCJgLCBvciBgXCIxZFwiYC5cbiAqIEBvdmVybG9hZFxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgc2xlZXAgaXMgY29tcGxldGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzbGVlcChkdXJhdGlvbjogU3RyaW5nVmFsdWUpOiBQcm9taXNlPHZvaWQ+O1xuXG4vKipcbiAqIFNsZWVwIHdpdGhpbiBhIHdvcmtmbG93IHVudGlsIGEgc3BlY2lmaWMgZGF0ZS5cbiAqXG4gKiBUaGlzIGlzIGEgYnVpbHQtaW4gcnVudGltZSBmdW5jdGlvbiB0aGF0IHVzZXMgdGltZXIgZXZlbnRzIGluIHRoZSBldmVudCBsb2cuXG4gKlxuICogQHBhcmFtIGRhdGUgLSBUaGUgZGF0ZSB0byBzbGVlcCB1bnRpbCwgdGhpcyBtdXN0IGJlIGEgZnV0dXJlIGRhdGUuXG4gKiBAb3ZlcmxvYWRcbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHNsZWVwIGlzIGNvbXBsZXRlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2xlZXAoZGF0ZTogRGF0ZSk6IFByb21pc2U8dm9pZD47XG5cbi8qKlxuICogU2xlZXAgd2l0aGluIGEgd29ya2Zsb3cgZm9yIGEgZ2l2ZW4gZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIFRoaXMgaXMgYSBidWlsdC1pbiBydW50aW1lIGZ1bmN0aW9uIHRoYXQgdXNlcyB0aW1lciBldmVudHMgaW4gdGhlIGV2ZW50IGxvZy5cbiAqXG4gKiBAcGFyYW0gZHVyYXRpb25NcyAtIFRoZSBkdXJhdGlvbiB0byBzbGVlcCBmb3IgaW4gbWlsbGlzZWNvbmRzLlxuICogQG92ZXJsb2FkXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBzbGVlcCBpcyBjb21wbGV0ZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNsZWVwKGR1cmF0aW9uTXM6IG51bWJlcik6IFByb21pc2U8dm9pZD47XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzbGVlcChwYXJhbTogU3RyaW5nVmFsdWUgfCBEYXRlIHwgbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIEluc2lkZSB0aGUgd29ya2Zsb3cgVk0sIHRoZSBzbGVlcCBmdW5jdGlvbiBpcyBzdG9yZWQgaW4gdGhlIGdsb2JhbFRoaXMgb2JqZWN0IGJlaGluZCBhIHN5bWJvbFxuICBjb25zdCBzbGVlcEZuID0gKGdsb2JhbFRoaXMgYXMgYW55KVtXT1JLRkxPV19TTEVFUF07XG4gIGlmICghc2xlZXBGbikge1xuICAgIHRocm93IG5ldyBFcnJvcignYHNsZWVwKClgIGNhbiBvbmx5IGJlIGNhbGxlZCBpbnNpZGUgYSB3b3JrZmxvdyBmdW5jdGlvbicpO1xuICB9XG4gIHJldHVybiBzbGVlcEZuKHBhcmFtKTtcbn1cbiIsICIvKipcbiAqIFRoaXMgaXMgdGhlIFwic3RhbmRhcmQgbGlicmFyeVwiIG9mIHN0ZXBzIHRoYXQgd2UgbWFrZSBhdmFpbGFibGUgdG8gYWxsIHdvcmtmbG93IHVzZXJzLlxuICogVGhlIGNhbiBiZSBpbXBvcnRlZCBsaWtlIHNvOiBgaW1wb3J0IHsgZmV0Y2ggfSBmcm9tICd3b3JrZmxvdydgLiBhbmQgdXNlZCBpbiB3b3JrZmxvdy5cbiAqIFRoZSBuZWVkIHRvIGJlIGV4cG9ydGVkIGRpcmVjdGx5IGluIHRoaXMgcGFja2FnZSBhbmQgY2Fubm90IGxpdmUgaW4gYGNvcmVgIHRvIHByZXZlbnRcbiAqIGNpcmN1bGFyIGRlcGVuZGVuY2llcyBwb3N0LWNvbXBpbGF0aW9uLlxuICovXG5cbi8qKlxuICogQSBob2lzdGVkIGBmZXRjaCgpYCBmdW5jdGlvbiB0aGF0IGlzIGV4ZWN1dGVkIGFzIGEgXCJzdGVwXCIgZnVuY3Rpb24sXG4gKiBmb3IgdXNlIHdpdGhpbiB3b3JrZmxvdyBmdW5jdGlvbnMuXG4gKlxuICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRmV0Y2hfQVBJXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaCguLi5hcmdzOiBQYXJhbWV0ZXJzPHR5cGVvZiBnbG9iYWxUaGlzLmZldGNoPikge1xuICAndXNlIHN0ZXAnO1xuICByZXR1cm4gZ2xvYmFsVGhpcy5mZXRjaCguLi5hcmdzKTtcbn1cbiIsICJpbXBvcnQgeyBzbGVlcCB9IGZyb20gJ3dvcmtmbG93Jztcbi8qKl9faW50ZXJuYWxfd29ya2Zsb3dze1wid29ya2Zsb3dzXCI6e1wid29ya2Zsb3dzL3VzZXItc2lnbnVwLnRzXCI6e1wiaGFuZGxlVXNlclNpZ251cFwiOntcIndvcmtmbG93SWRcIjpcIndvcmtmbG93Ly8uL3dvcmtmbG93cy91c2VyLXNpZ251cC8vaGFuZGxlVXNlclNpZ251cFwifX19LFwic3RlcHNcIjp7XCJ3b3JrZmxvd3MvdXNlci1zaWdudXAudHNcIjp7XCJjcmVhdGVVc2VyXCI6e1wic3RlcElkXCI6XCJzdGVwLy8uL3dvcmtmbG93cy91c2VyLXNpZ251cC8vY3JlYXRlVXNlclwifSxcInNlbmRPbmJvYXJkaW5nRW1haWxcIjp7XCJzdGVwSWRcIjpcInN0ZXAvLy4vd29ya2Zsb3dzL3VzZXItc2lnbnVwLy9zZW5kT25ib2FyZGluZ0VtYWlsXCJ9LFwic2VuZFdlbGNvbWVFbWFpbFwiOntcInN0ZXBJZFwiOlwic3RlcC8vLi93b3JrZmxvd3MvdXNlci1zaWdudXAvL3NlbmRXZWxjb21lRW1haWxcIn19fX0qLztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVVc2VyU2lnbnVwKGVtYWlsKSB7XG4gICAgY29uc3QgdXNlciA9IGF3YWl0IGNyZWF0ZVVzZXIoZW1haWwpO1xuICAgIGF3YWl0IHNlbmRXZWxjb21lRW1haWwodXNlcik7XG4gICAgYXdhaXQgc2xlZXAoJzVzJyk7XG4gICAgYXdhaXQgc2VuZE9uYm9hcmRpbmdFbWFpbCh1c2VyKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB1c2VySWQ6IHVzZXIuaWQsXG4gICAgICAgIHN0YXR1czogJ29uYm9hcmRlZCdcbiAgICB9O1xufVxuaGFuZGxlVXNlclNpZ251cC53b3JrZmxvd0lkID0gXCJ3b3JrZmxvdy8vLi93b3JrZmxvd3MvdXNlci1zaWdudXAvL2hhbmRsZVVzZXJTaWdudXBcIjtcbmdsb2JhbFRoaXMuX19wcml2YXRlX3dvcmtmbG93cy5zZXQoXCJ3b3JrZmxvdy8vLi93b3JrZmxvd3MvdXNlci1zaWdudXAvL2hhbmRsZVVzZXJTaWdudXBcIiwgaGFuZGxlVXNlclNpZ251cCk7XG52YXIgY3JlYXRlVXNlciA9IGdsb2JhbFRoaXNbU3ltYm9sLmZvcihcIldPUktGTE9XX1VTRV9TVEVQXCIpXShcInN0ZXAvLy4vd29ya2Zsb3dzL3VzZXItc2lnbnVwLy9jcmVhdGVVc2VyXCIpO1xudmFyIHNlbmRXZWxjb21lRW1haWwgPSBnbG9iYWxUaGlzW1N5bWJvbC5mb3IoXCJXT1JLRkxPV19VU0VfU1RFUFwiKV0oXCJzdGVwLy8uL3dvcmtmbG93cy91c2VyLXNpZ251cC8vc2VuZFdlbGNvbWVFbWFpbFwiKTtcbnZhciBzZW5kT25ib2FyZGluZ0VtYWlsID0gZ2xvYmFsVGhpc1tTeW1ib2wuZm9yKFwiV09SS0ZMT1dfVVNFX1NURVBcIildKFwic3RlcC8vLi93b3JrZmxvd3MvdXNlci1zaWdudXAvL3NlbmRPbmJvYXJkaW5nRW1haWxcIik7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsc0NBQUFBLFNBQUE7QUFFSSxRQUFJLElBQUk7QUFDWixRQUFJLElBQUksSUFBSTtBQUNaLFFBQUksSUFBSSxJQUFJO0FBQ1osUUFBSSxJQUFJLElBQUk7QUFDWixRQUFJLElBQUksSUFBSTtBQUNaLFFBQUksSUFBSSxJQUFJO0FBYVIsSUFBQUEsUUFBTyxVQUFVLFNBQVMsS0FBSyxTQUFTO0FBQ3hDLGdCQUFVLFdBQVcsQ0FBQztBQUN0QixVQUFJLE9BQU8sT0FBTztBQUNsQixVQUFJLFNBQVMsWUFBWSxJQUFJLFNBQVMsR0FBRztBQUNyQyxlQUFPLE1BQU0sR0FBRztBQUFBLE1BQ3BCLFdBQVcsU0FBUyxZQUFZLFNBQVMsR0FBRyxHQUFHO0FBQzNDLGVBQU8sUUFBUSxPQUFPLFFBQVEsR0FBRyxJQUFJLFNBQVMsR0FBRztBQUFBLE1BQ3JEO0FBQ0EsWUFBTSxJQUFJLE1BQU0sMERBQTBELEtBQUssVUFBVSxHQUFHLENBQUM7QUFBQSxJQUNqRztBQU9JLGFBQVMsTUFBTSxLQUFLO0FBQ3BCLFlBQU0sT0FBTyxHQUFHO0FBQ2hCLFVBQUksSUFBSSxTQUFTLEtBQUs7QUFDbEI7QUFBQSxNQUNKO0FBQ0EsVUFBSSxRQUFRLG1JQUFtSSxLQUFLLEdBQUc7QUFDdkosVUFBSSxDQUFDLE9BQU87QUFDUjtBQUFB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
`);
//#endregion
//#region #workflow/workflows.mjs
var workflows_default = async ({ req }) => {
	try {
		return await POST(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/icons.svg": {
		"type": "image/svg+xml",
		"etag": "\"13a7-+Yl6wl4T3p6mAdLxrF2TU9++/No\"",
		"mtime": "2026-04-24T17:14:08.695Z",
		"size": 5031,
		"path": "../public/icons.svg"
	},
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"2532-P1u486agW3ymimJYHS3VvIiBLK8\"",
		"mtime": "2026-04-24T17:14:08.695Z",
		"size": 9522,
		"path": "../public/favicon.svg"
	},
	"/assets/hero-CLDdwZDr.png": {
		"type": "image/png",
		"etag": "\"3301-ATyZLDByC/FWtivUyKJ2DnH+hCo\"",
		"mtime": "2026-04-24T17:14:08.689Z",
		"size": 13057,
		"path": "../public/assets/hero-CLDdwZDr.png"
	},
	"/assets/index-D64VDMd1.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1009-xaTeSuiII/ptcPIpcg0FFHs1g0E\"",
		"mtime": "2026-04-24T17:14:08.689Z",
		"size": 4105,
		"path": "../public/assets/index-D64VDMd1.css"
	},
	"/assets/vite-BF8QNONU.svg": {
		"type": "image/svg+xml",
		"etag": "\"2205-8Id10YshYfdpJnvcDr2896pjIJk\"",
		"mtime": "2026-04-24T17:14:08.689Z",
		"size": 8709,
		"path": "../public/assets/vite-BF8QNONU.svg"
	},
	"/assets/react-CHdo91hT.svg": {
		"type": "image/svg+xml",
		"etag": "\"101e-9QXdyOvla9xR77ch7wSSOo0waN0\"",
		"mtime": "2026-04-24T17:14:08.689Z",
		"size": 4126,
		"path": "../public/assets/react-CHdo91hT.svg"
	},
	"/assets/index-uMMnN8UP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2f8ee-z0H9MoZt6nMAs3vDy+2bHxoQexo\"",
		"mtime": "2026-04-24T17:14:08.689Z",
		"size": 194798,
		"path": "../public/assets/index-uMMnN8UP.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_D22kmH = defineLazyEventHandler(() => import("./_routes/api/signup.mjs"));
var _lazy_chItnI = defineLazyEventHandler(() => import("./_chunks/renderer-template.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/.well-known/workflow/v1/step",
		handler: toEventHandler(steps_default)
	}, $1 = {
		route: "/.well-known/workflow/v1/flow",
		handler: toEventHandler(workflows_default)
	}, $2 = {
		route: "/api/signup",
		method: "post",
		handler: _lazy_D22kmH
	}, $3 = {
		route: "/.well-known/workflow/v1/webhook/:token",
		handler: toEventHandler(webhook_default)
	}, $4 = {
		route: "/**",
		handler: _lazy_chItnI
	};
	return (m, p) => {
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		if (p === "/.well-known/workflow/v1/step") return { data: $0 };
		else if (p === "/.well-known/workflow/v1/flow") return { data: $1 };
		else if (p === "/api/signup") {
			if (m === "POST") return { data: $2 };
		}
		let s = p.split("/"), l = s.length;
		if (l > 1) {
			if (s[1] === ".well-known") {
				if (l > 2) {
					if (s[2] === "workflow") {
						if (l > 3) {
							if (s[3] === "v1") {
								if (l > 4) {
									if (s[4] === "webhook") {
										if (l === 6 || l === 5) {
											if (l > 5) return {
												data: $3,
												params: { "token": s[5] }
											};
										}
									}
								}
							}
						}
					}
				}
			}
		}
		return {
			data: $4,
			params: { "_": s.slice(1).join("/") }
		};
	};
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function createNitroApp() {
	const hooks = void 0;
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		{
			const routeRules = getRouteRules(method, pathname);
			event.context.routeRules = routeRules?.routeRules;
			if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		}
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
