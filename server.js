'use strict';

const express       = require('express');
const app             = express();
const ejs             = require('ejs');
const Server          = require('./modules/Server');

let server = new Server(app);
