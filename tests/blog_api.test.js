const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

beforeEach(async () => {
  await Blog.deleteMany({});
  console.log('cleared');

  await Blog.insertMany(helper.initialBlogs);
});

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json with correct initial length', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const response = await api.get('/api/blogs');

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });
});

describe('viewing a specific blog', () => {
  test('blogs are returned with the property id', async () => {
    const response = await api.get('/api/blogs');

    const contents = response.body.map((r) => r.id);

    contents.forEach((content) => {
      expect(content).toBeDefined();
    });
  });
});

describe('addition of a new blog', () => {
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
});

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];
    console.log('id', blogToDelete.id.toString());

    const response = await api.delete(
      `/api/blogs/${blogToDelete.id.toString()}`
    );

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

    const contents = blogsAtEnd.map((r) => r.title);

    expect(contents).not.toContain(blogToDelete.content);
  });
});

describe('update of a blog', () => {
  test('succeeds with status code 200 if blogs are updated', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = { ...blogsAtStart[0] };
    blogToUpdate.likes = 20;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).not.toEqual(blogsAtStart);
  });
});

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({
      username: 'root',
      passwordHash,
    });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails with proper statuscode and message if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('`username` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if username and/or passwords are invalid', async () => {
    const newUser = {
      username: 'ro',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('invalid username or password');

    const newUser1 = {
      username: 'rooot',
      name: 'Superuser',
      password: 'sa',
    };

    const result1 = await api
      .post('/api/users')
      .send(newUser1)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result1.body.error).toContain('invalid username or password');
  });

  test('creation of a blog post with valid user', async () => {
    const usersAtStart = await helper.usersInDb();
    const startUser = { ...usersAtStart[0] };
    const userLength = startUser.blogs.length;

    const loginInfo = {
      username: 'root',
      password: 'sekret',
    };

    const login = await api
      .post('/api/login')
      .send(loginInfo)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const newBlog = {
      title: 'New Blog here',
      author: 'Mishael Magsanoc',
      url: 'http://example.com',
      likes: 5,
      userId: startUser.id,
    };

    let token = 'bearer ' + login.body.token;

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    const endUser = usersAtEnd[0];

    expect(endUser.blogs).toHaveLength(userLength + 1);
  });

  test.only('blog post not added without a proper token', async () => {
    const usersAtStart = await helper.usersInDb();
    const startUser = { ...usersAtStart[0] };

    const newBlog = {
      title: 'New Blog here',
      author: 'Mishael Magsanoc',
      url: 'http://example.com',
      likes: 5,
      userId: startUser.id,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', null)
      .expect(401)
      .expect('Content-Type', /application\/json/);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
