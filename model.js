const mongoose = require('mongoose');

// setup schema
const blogSchema = mongoose.Schema({
    title: { type: String, required: true },
    author: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true }
    },
    content: { type: String },
    created: { type: Date, default: Date.now }
});

// virtual for full name; NOTE: don't use ES6 arrow here- it will error
blogSchema.virtual('authorFullName').get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.apiRep = function () {
    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorFullName,
        created: this.created
    };
};

const Blog = mongoose.model('Blog', blogSchema);

module.exports = { Blog };