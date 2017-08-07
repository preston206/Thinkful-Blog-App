const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.Promise = global.Promise;

app.use(bodyParser.json());

const { PORT, DATABASE_URL } = require('./config');
const { Blog } = require('./model');

app.get('/posts', (req, res) => {

});

app.get('/posts/:id', (req, res) => {

});

app.post('/posts/', (req, res) => {

});

app.put('/posts/:id', (req, res) => {

});

app.delete('/posts/:id', (req, res) => {

});