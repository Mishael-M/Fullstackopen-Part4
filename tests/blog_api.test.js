const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');

beforeEach(async () => {
  await Blog.deleteMany({});
  console.log('cleared');

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

test('blogs are returned as json with correct initial length', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const response = await api.get('/api/blogs');

  expect(response.body).toHaveLength(helper.initialBlogs.length);
}, 100000);

test('blogs are returned with the property id', async () => {
  const response = await api.get('/api/blogs');

  const contents = response.body.map((r) => r.id);

  contents.forEach((content) => {
    expect(content).toBeDefined();
  });
});

test('a valid blog post can be created', async () => {
  const newBlog = {
    title: 'New Blog here',
    author: 'Mishael Magsanoc',
    url: 'http://example.com',
    likes: 5,
  };

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const response = await api.get('/api/blogs');
  const contentsTitle = response.body.map((r) => r.title);
  const contentsAuthor = response.body.map((r) => r.author);
  const contentsUrl = response.body.map((r) => r.url);
  const contentsLike = response.body.map((r) => r.likes);

  expect(response.body).toHaveLength(helper.initialBlogs.length + 1);
  expect(contentsTitle).toContain('New Blog here');
  expect(contentsAuthor).toContain('Mishael Magsanoc');
  expect(contentsUrl).toContain('http://example.com');
  expect(contentsLike).toContain(5);
});

test('a blog post missing the likes property defaults the value to 0', async () => {
  const newBlog = {
    title: 'New Blog here',
    author: 'Mishael Magsanoc',
    url: 'http://example.com',
  };

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const response = await api.get('/api/blogs');

  const contents = response.body.filter((r) => r.title === 'New Blog here');

  expect(contents[0].likes).toEqual(0);
});

test('a blog post is invalid if it is missing the title and url properties', async () => {
  const newBlog = {
    url: 'http://example.com',
  };

  await api.post('/api/blogs').send(newBlog).expect(400);
});

afterAll(() => {
  mongoose.connection.close();
});
