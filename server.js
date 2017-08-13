const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { Blog } = require('./model');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());


// get blog posts
app.get('/posts', (req, res) => {
    console.log("getting data; brb");
    Blog
        .find()
        .limit(7)
        .exec()
        // NOTE: "posts" is not arbitrary- it is the actual name of the collection! I spent hours troubleshooting that!
        .then(posts => {
            res.json({
                posts: posts.map(
                    (post) => post.apiRepr())
            });
                console.log(res);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ "error message": "we encountered an error when attempting to get your data" });
        });
});


// get blog post by ID
app.get('/posts/:id', (req, res) => {
    Blog
        .findById(req.params.id)
        .exec()
        .then(post => res.json(post.apiRepr()))
        .catch(error => {
            console.log(error);
            res.status(500).json({ "error message": 'we encountered an error when attempting to get your data' })
        });
});


// create blog post
app.post('/posts', (req, res) => {
    const requiredFields = ['title', 'content', 'author'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Blog
        .create({
            title: req.body.title,
            author: req.body.author,
            content: req.body.content
        })
        .then(
        post => res.status(201).json(post.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        });
});


// modify blog post
app.put('/posts/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = (
            `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`);
        console.error(message);
        res.status(400).json({ message: message });
    }

    const toUpdate = {};
    const updateableFields = ['title', 'author', 'content'];

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });

    Blog
        .findByIdAndUpdate(req.params.id, { $set: toUpdate })
        .exec()
        .then(post => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});


//delete blog post
app.delete('/posts/:id', (req, res) => {
    Blog
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(post => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

let server;

// connect to db, then starts the server
function runServer(databaseUrl = DATABASE_URL, port = PORT) {

    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
                .on('error', err => {
                    console.log(err);
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

// close server
function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };