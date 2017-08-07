const mongoose = require('mongoose');

// setup schema
const blogSchema = mongoose.Schema({
    title: { type: String, required: true },
    author: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true }
    },
    content: { type: String, required: true },
    created: { type: Date }
});

// virtual for full name
blogSchema.virtual('authorFullName').get(() => {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.apiRep = function() {
    return {
        id: this._id,
        created: this.created,
        title: this.title,
        author: this.authorFullName,
        content: this.content
    };
};

const Blog = mongoose.model('Blog', blogSchema);

module.exports = {Blog};