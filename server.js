const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.Promise = global.Promise;

app.use(bodyParser.json());

const { PORT, DATABASE_URL } = require('./config');
const { Blog } = require('./model');


// get request for 5 blog posts
app.get('/posts', (req, res) => {
    Blog
        .find()
        .limit(5)
        .exec()
        .then(blogs => {
            res.json({
                blogs: blogs.map(
                    (blog) => blog.apiRep())
            });
        })
        .catch(
        error => {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        });
});


// get blog post by ID
app.get('/posts/:id', (req, res) => {
    Blog
        .findById(req.params.id)
        .exec()
        .then(blog => res.json(blog.apiRep()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' })
        });
});


// create blog post
app.post('/posts/', (req, res) => {
    const requiredFields = ['title', 'firstName', 'lastName', 'content'];
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
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            content: req.body.content
        })
        .then(
        blog => res.status(201).json(blog.apiRep()))
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
    const updateableFields = ['title', 'firstName', 'lastName', 'content'];

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });

    Blog
        .findByIdAndUpdate(req.params.id, { $set: toUpdate })
        .exec()
        .then(blog => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});


//delete blog post
app.delete('/posts/:id', (req, res) => {
    Blog
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(blog => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

let server;

// connect to db, then starts the server
function runServer(databaseUrl = DATABASE_URL, port = PORT) {

    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
                .on('error', err => {
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