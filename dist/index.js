module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 506:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

const core = __webpack_require__(721);
const github = __webpack_require__(530);
const { WebClient } = __webpack_require__(650);
const flatten = __webpack_require__(76);
const axios = __webpack_require__(202);

try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    console.log('botToken', botToken, typeof botToken)
    console.log('webhookUrl', webhookUrl, typeof webhookUrl)


    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;
    // console.log(`The event payload: ${JSON.stringify(payload, undefined, 2)}`);

    if (botToken === undefined && webhookUrl === undefined) {
        throw 'Need to provide at least one botToken or webhookUrl'
    }

    if (botToken.length > 0) {
        const message = core.getInput('slack-message');
        const channelId = core.getInput('channel-id');
        console.log('message', message, typeof message)
        console.log('channelId', channelId, typeof channelId)

        const web = new WebClient(botToken);

        if(channelId.length > 0 && message.length > 0) {
            // post message
            web.chat.postMessage({text: message, channel: channelId});
        } else {
            console.log('missing either channel-id or slack-message! Did not send a message via chat.postMessage with botToken');
        }
    } 
    
    if (webhookUrl.length > 0) {
        // send flat payload to webhookUrl
        const flatPayload = flatten(payload);

        // workflow builder requires values to be strings
        // iterate over every value and convert it to string
        Object.keys(flatPayload).forEach((key) => {
            flatPayload[key] = '' + flatPayload[key];
        })

        console.log(flatPayload);

        axios.post(webhookUrl, flatPayload)
    }

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);

    } catch (error) {
    core.setFailed(error.message);
}

/***/ }),

/***/ 721:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 530:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 650:
/***/ ((module) => {

module.exports = eval("require")("@slack/web-api");


/***/ }),

/***/ 202:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ }),

/***/ 76:
/***/ ((module) => {

module.exports = eval("require")("flat");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__webpack_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(506);
/******/ })()
;