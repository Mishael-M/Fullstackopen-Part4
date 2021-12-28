var _ = require('lodash');

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  const reducer = (previousValue, currentValue) => {
    return previousValue + currentValue.likes;
  };

  return blogs.reduce(reducer, 0);
};

const favouriteBlog = (blogs) => {
  const blogsLikes = blogs.map((blog) => Number(blog.likes));

  const index = blogs.findIndex(
    (blog) => blog.likes === Math.max(...blogsLikes)
  );

  const returnBlog = {
    title: blogs[index].title,
    author: blogs[index].author,
    likes: blogs[index].likes,
  };
  return returnBlog;
};

const mostBlogs = (blogs) => {
  const authorBlogs = _.groupBy(blogs, 'author');

  const author = _.maxBy(Object.entries(authorBlogs), (length) => length[1]);

  return {
    author: author[0],
    blogs: author[1].length,
  };
};

const mostLikes = (blogs) => {
  const authorBlogs = _.groupBy(blogs, 'author');

  const author = Object.entries(authorBlogs).map((author) => author[0]);
  const authorEntries = Object.entries(authorBlogs).map((author) => author[1]);

  const reducer = (previousValue, currentValue) =>
    previousValue + currentValue.likes;

  const likes = authorEntries.map((author) => author.reduce(reducer, 0));
  const index = likes.findIndex((author) => author === Math.max(...likes));

  return {
    author: author[index],
    likes: likes[index],
  };
};

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs,
  mostLikes,
};
