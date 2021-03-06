const db = require("../db/connection.js");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app.js");
const request = require("supertest");
const { toBeSortedBy } = require("jest-sorted");
const { createStringOfLength } = require("../db/utils/data-manipulation");

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe("GET /api/articles/:article_id", () => {
  test("200: return a single object", async () => {
    const res = await request(app).get("/api/articles/2").expect(200);
    expect(typeof res.body.article).toBe("object");
    expect(Array.isArray(res.body.article)).toBe(false);
  });

  test("200: object returned has correct keys and correct value data types", async () => {
    const res = await request(app).get("/api/articles/1").expect(200);
    expect(res.body.article).toMatchObject({
      author: expect.any(String),
      title: expect.any(String),
      article_id: expect.any(Number),
      body: expect.any(String),
      topic: expect.any(String),
      created_at: expect.any(String),
      votes: expect.any(Number),
      comment_count: expect.any(Number),
    });
  });

  test("200: returns an object containing the expected article data", async () => {
    const res = await request(app).get("/api/articles/1").expect(200);
    expect(res.body.article).toEqual({
      author: "butter_bridge",
      title: "Living in the shadow of a great man",
      article_id: 1,
      body: "I find this existence challenging",
      topic: "mitch",
      created_at: expect.any(String),
      votes: 100,
      comment_count: 13,
    });
  });

  test("200: returns an object with comment_count property of 0 when an article does not have any associated comments", async () => {
    const res = await request(app).get("/api/articles/4").expect(200);
    expect(res.body.article).toEqual({
      author: "rogersop",
      title: "Student SUES Mitch!",
      article_id: 4,
      body: "We all love Mitch and his wonderful, unique typing style. However, the volume of his typing has ALLEGEDLY burst another students eardrums, and they are now suing for damages",
      topic: "mitch",
      created_at: expect.any(String),
      votes: 0,
      comment_count: 0,
    });
  });

  test("400: when passed a non-valid article_id", async () => {
    const res = await request(app).get("/api/articles/invalid_id").expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("404: when passed a valid but non-existent article_id", async () => {
    const res = await request(app).get("/api/articles/92").expect(404);
    expect(res.body.msg).toBe("Article not found");
  });
});

describe("PATCH /api/articles/:article_id", () => {
  test("200: return a single object", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200);
    expect(typeof res.body.article).toBe("object");
    expect(Array.isArray(res.body.article)).toBe(false);
  });

  test("200: object returned has correct keys and correct value data types", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200);
    expect(res.body.article).toMatchObject({
      article_id: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
      votes: expect.any(Number),
      topic: expect.any(String),
      author: expect.any(String),
      created_at: expect.any(String),
    });
  });

  test("200: object returned has votes property increased when passed a inc_votes value of >= 1", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200);
    expect(res.body.article.votes).toBe(101);
  });

  test("200: object returned has votes property decreased when passed a inc_votes value of < 0", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -40 })
      .expect(200);
    expect(res.body.article.votes).toBe(60);
  });

  test("200: ignores any extra properties passed in", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1, another_property: "ignore me" })
      .expect(200);
    expect(res.body.article).not.toHaveProperty("another_property");
  });

  test("404: when passed a valid but non-existent article_id", async () => {
    const res = await request(app)
      .patch("/api/articles/85")
      .send({ inc_votes: 10 })
      .expect(404);
    expect(res.body.msg).toBe("Article not found");
  });

  test("400: when passed a non-valid article_id", async () => {
    const res = await request(app)
      .patch("/api/articles/invalid_id")
      .send({ inc_votes: 10 })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("400: when passed an invalid inc_votes property", async () => {
    const res = await request(app)
      .patch("/api/articles/4")
      .send({ inc_votes: "invalid string" })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
    const res2 = await request(app)
      .patch("/api/articles/1")
      .send({})
      .expect(400);
    expect(res2.body.msg).toBe("Bad request");
  });
});

describe("GET /api/articles", () => {
  test("200: returns an object with an articles property and a total_count property", async () => {
    const res = await request(app).get("/api/articles").expect(200);
    const properties = Object.keys(res.body);
    expect(properties.length).toBe(2);
    expect(properties.includes("articles")).toBe(true);
    expect(properties.includes("total_count")).toBe(true);
  });

  test("200: article key contains an array of article objects", async () => {
    const res = await request(app).get("/api/articles").expect(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    res.body.articles.forEach((article) =>
      expect(typeof article).toBe("object")
    );
    res.body.articles.forEach((article) =>
      expect(article).toMatchObject({
        author: expect.any(String),
        title: expect.any(String),
        article_id: expect.any(Number),
        topic: expect.any(String),
        created_at: expect.any(String),
        votes: expect.any(Number),
        comment_count: expect.any(Number),
      })
    );
  });

  test("200: returned article objects have expected comment_count value", async () => {
    const res = await request(app).get("/api/articles/").expect(200);
    const article1 = res.body.articles.find(
      (article) => article.article_id === 1
    );
    expect(article1.comment_count).toBe(13);
    const article4 = res.body.articles.find(
      (article) => article.article_id === 4
    );
    expect(article4.comment_count).toBe(0);
  });

  test("200: responds with the first 10 articles by default", async () => {
    const res = await request(app).get("/api/articles/").expect(200);
    expect(res.body.articles.length).toBe(10);
  });

  test("200: when passed a limit, responds with that number of articles", async () => {
    const res = await request(app).get("/api/articles/?limit=4").expect(200);
    expect(res.body.articles.length).toBe(4);
  });

  test("200: total_count property returns the number of all articles available regardless of limit query passed in", async () => {
    const res = await request(app).get("/api/articles").expect(200);
    expect(res.body.total_count).toBe(12);
    const res2 = await request(app).get("/api/articles?limit=5").expect(200);
    expect(res2.body.total_count).toBe(12);
  });

  test("200: when passed a page query, responds with that page of articles", async () => {
    const res = await request(app).get("/api/articles/?page=2").expect(200);
    expect(res.body.articles.length).toBe(2);
  });

  test("200: when passed a page query, responds with an empty array if the page contains no articles", async () => {
    const res = await request(app).get("/api/articles/?page=3").expect(200);
    expect(res.body.articles.length).toBe(0);
  });

  test("200: returned articles are returned sorted by date in descending order by default", async () => {
    const res = await request(app).get("/api/articles/").expect(200);
    expect(res.body.articles).toBeSortedBy("created_at", { descending: true });
  });

  test("200: returned articles are returned sorted by a column specified by the user in descending order by default", async () => {
    const res = await request(app)
      .get("/api/articles?sort_by=votes")
      .expect(200);
    expect(res.body.articles).toBeSortedBy("votes", { descending: true });
    const res2 = await request(app)
      .get("/api/articles?sort_by=title")
      .expect(200);
    expect(res2.body.articles).toBeSortedBy("title", { descending: true });
  });

  test("200: returned articles are returned sorted in ascending order when specified by the user in the passed-in order parameter", async () => {
    const res = await request(app).get("/api/articles?order=asc").expect(200);
    expect(res.body.articles).toBeSortedBy("created_at", { ascending: true });
    const res2 = await request(app)
      .get("/api/articles?sort_by=author&order=asc")
      .expect(200);
    expect(res2.body.articles).toBeSortedBy("author", { ascending: true });
  });

  test("200: all articles are returned when no topic parameter is specified", async () => {
    const page1 = await request(app).get("/api/articles").expect(200);
    expect(page1.body.articles.length).toBe(10);
    const page2 = await request(app).get("/api/articles?page=2").expect(200);
    expect(page2.body.articles.length).toBe(2);
  });

  test("200: returns only the articles associated with the specified topic when topic is passed in as a parameter", async () => {
    const page1 = await request(app)
      .get("/api/articles?topic=mitch")
      .expect(200);
    expect(page1.body.articles.length).toBe(10);
    page1.body.articles.forEach((article) =>
      expect(article.topic).toBe("mitch")
    );
    const page2 = await request(app)
      .get("/api/articles?topic=mitch&page=2")
      .expect(200);
    expect(page2.body.articles.length).toBe(1);
    expect(page2.body.articles[0].topic).toBe("mitch");
  });

  test("200: returns an empty array when a valid topic is passed in but has no associated articles", async () => {
    const res = await request(app).get("/api/articles?topic=paper").expect(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articles.length).toBe(0);
  });

  test("200: all articles are returned when no author parameter is specified", async () => {
    const page1 = await request(app).get("/api/articles").expect(200);
    expect(page1.body.articles.length).toBe(10);
    const page2 = await request(app).get("/api/articles?page=2").expect(200);
    expect(page2.body.articles.length).toBe(2);
  });

  test("200: returns only the articles associated with a specified author when author is passed in as a parameter", async () => {
    const res = await request(app)
      .get("/api/articles?author=rogersop")
      .expect(200);
    expect(res.body.articles.length).toBe(3);
    res.body.articles.forEach((article) =>
      expect(article.author).toBe("rogersop")
    );
  });

  test("200: returns an empty array when a valid author is passed in but has no associated articles", async () => {
    const res = await request(app)
      .get("/api/articles?author=lurker")
      .expect(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articles.length).toBe(0);
  });

  test("200: returns only articles associated with a particular author on a particular topic when author and topic parameters passed in", async () => {
    const res = await request(app)
      .get("/api/articles?author=icellusedkars&topic=mitch")
      .expect(200);
    expect(res.body.articles.length).toBe(6);
    res.body.articles.forEach((article) =>
      expect(article.author).toBe("icellusedkars")
    );
    res.body.articles.forEach((article) => expect(article.topic).toBe("mitch"));
  });

  test("400: returns bad request message when an invalid page query is passed in", async () => {
    const res = await request(app).get("/api/articles?page=0").expect(400);
    expect(res.body.msg).toBe("Bad request");
    const res2 = await request(app)
      .get("/api/articles?page=invalid_page")
      .expect(400);
    expect(res2.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when an invalid limit query is passed in", async () => {
    const res = await request(app).get("/api/articles?limit=-2").expect(400);
    expect(res.body.msg).toBe("Bad request");
    const res2 = await request(app)
      .get("/api/articles?limit=invalid_limit")
      .expect(400);
    expect(res2.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when a limit of over 100 is passed in", async () => {
    const res = await request(app).get("/api/articles?limit=101").expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when invalid sort_by query passed in", async () => {
    const res = await request(app)
      .get("/api/articles?sort_by=not_a_column")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when invalid order query passed in", async () => {
    const res = await request(app)
      .get("/api/articles?order=diagonal")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("404: returns topic not found message when non-existent topic passed in", async () => {
    const res = await request(app)
      .get("/api/articles?topic=non_existent_topic")
      .expect(404);
    expect(res.body.msg).toBe("Topic not found");
  });
});

describe("GET /api/articles/:article_id/comments", () => {
  test("200: returns an object with a comments property and a total_count property", async () => {
    const res = await request(app).get("/api/articles/1/comments").expect(200);
    const properties = Object.keys(res.body);
    expect(properties.length).toBe(2);
    expect(properties.includes("comments")).toBe(true);
    expect(properties.includes("total_count")).toBe(true);
  });

  test("200: the comments property contains an array of all comment objects associated with the specified article", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?limit=20")
      .expect(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBe(13);
    res.body.comments.forEach((comment) =>
      expect(typeof comment).toBe("object")
    );
  });

  test("200: returns an empty array if there are no comments associated with specified article", async () => {
    const res = await request(app).get("/api/articles/2/comments").expect(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBe(0);
  });

  test("200: comment objects returned have correct keys and correct value data types", async () => {
    const res = await request(app).get("/api/articles/1/comments").expect(200);
    res.body.comments.forEach((comment) => {
      expect(comment).toMatchObject({
        comment_id: expect.any(Number),
        votes: expect.any(Number),
        created_at: expect.any(String),
        author: expect.any(String),
        body: expect.any(String),
      });
    });
  });

  test("200: responds with the first 10 comments by default", async () => {
    const res = await request(app).get("/api/articles/1/comments").expect(200);
    expect(res.body.comments.length).toBe(10);
  });

  test("200: when passed a limit, responds with that number of comments", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?limit=5")
      .expect(200);
    expect(res.body.comments.length).toBe(5);
  });

  test("200: total_count property returns the number of all comments available regardless of limit query passed in", async () => {
    const res = await request(app).get("/api/articles/1/comments").expect(200);
    expect(res.body.total_count).toBe(13);
    const res2 = await request(app)
      .get("/api/articles/1/comments?limit=5")
      .expect(200);
    expect(res2.body.total_count).toBe(13);
  });

  test("200: when passed a page query, responds with that page of articles", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?page=2")
      .expect(200);
    expect(res.body.comments.length).toBe(3);
  });

  test("200: when passed a page query, responds with an empty array if the page contains no comments", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?page=3")
      .expect(200);
    expect(res.body.comments.length).toBe(0);
  });

  test("404: returns Article not found message when passed a valid but non-existent article_id", async () => {
    const res = await request(app)
      .get("/api/articles/101/comments")
      .expect(404);
    expect(res.body.msg).toBe("Article not found");
  });

  test("400: returns Bad request message when passed an invalid article_id", async () => {
    const res = await request(app)
      .get("/api/articles/not_a_valid_id/comments")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when an invalid page query is passed in", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?page=0")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
    const res2 = await request(app)
      .get("/api/articles/1/comments?page=invalid_page")
      .expect(400);
    expect(res2.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when an invalid limit query is passed in", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?limit=-2")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
    const res2 = await request(app)
      .get("/api/articles/1/comments?limit=invalid_limit")
      .expect(400);
    expect(res2.body.msg).toBe("Bad request");
  });

  test("400: returns bad request message when a limit of over 100 is passed in", async () => {
    const res = await request(app)
      .get("/api/articles/1/comments?limit=101")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("201: returns a single object", async () => {
    const res = await request(app)
      .post("/api/articles/3/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(201);
    expect(typeof res.body.comment).toBe("object");
    expect(Array.isArray(res.body.comment)).toBe(false);
  });

  test("201: returned object has the correct keys and correct value data types", async () => {
    const res = await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(201);
    expect(res.body.comment).toMatchObject({
      comment_id: expect.any(Number),
      votes: expect.any(Number),
      created_at: expect.any(String),
      author: expect.any(String),
      body: expect.any(String),
    });
  });

  test("201: returns the correct comment object", async () => {
    const res = await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(201);
    expect(res.body.comment).toMatchObject({
      comment_id: expect.any(Number),
      votes: 0,
      created_at: expect.any(String),
      author: "lurker",
      body: "Living his best pug life",
    });
  });

  test("201: ignores any extra keys included in request body", async () => {
    const res = await request(app)
      .post("/api/articles/1/comments")
      .send({
        username: "lurker",
        body: "Living his best pug life",
        extra: "ignore me",
      })
      .expect(201);
    expect(res.body.comment).toMatchObject({
      comment_id: expect.any(Number),
      votes: 0,
      created_at: expect.any(String),
      author: "lurker",
      body: "Living his best pug life",
    });
    expect(res.body.comment).not.toHaveProperty("extra");
  });

  test("201: comment is added to the database", async () => {
    await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(201);
    const res = await request(app)
      .get("/api/articles/1/comments?limit=20")
      .expect(200);
    expect(res.body.comments.length).toBe(14);
    expect(
      res.body.comments.filter((comment) => {
        return (
          comment.author === "lurker" &&
          comment.body === "Living his best pug life"
        );
      }).length
    ).toBe(1);
  });

  test("404: returns Article not found message when passed a valid but non-existent article_id", async () => {
    const res = await request(app)
      .post("/api/articles/101/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(404);
    expect(res.body.msg).toBe("Article not found");
  });

  test("400: returns Bad request message when passed an invalid article_id", async () => {
    const res = await request(app)
      .post("/api/articles/invalid_id/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("400: returns Bad request message when username and/or body parameter is not specified", async () => {
    const res = await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker" })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
    const res2 = await request(app)
      .post("/api/articles/1/comments")
      .send({ body: "Living his best pug life" })
      .expect(400);
    expect(res2.body.msg).toBe("Bad request");
  });

  test("404: returns User not found when username does not exist", async () => {
    const res = await request(app)
      .post("/api/articles/2/comments")
      .send({ username: "alex", body: "This comment will never be posted" })
      .expect(404);
    expect(res.body.msg).toBe("User not found");
  });

  test("400: returns Bad request when comment body is over 500 characters", async () => {
    const longString = createStringOfLength(501);
    const res = await request(app)
      .post("/api/articles/2/comments")
      .send({ username: "lurker", body: longString })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });
});

describe("POST /api/articles", () => {
  test("201: returns a single article object", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(201);
    expect(typeof res.body.article).toBe("object");
    expect(Array.isArray(res.body.article)).toBe(false);
  });

  test("201: returned object has the correct keys and correct value data types", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(201);
    expect(res.body.article).toMatchObject({
      article_id: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
      votes: expect.any(Number),
      topic: expect.any(String),
      created_at: expect.any(String),
      author: expect.any(String),
      comment_count: expect.any(Number),
    });
  });

  test("201: returns the correct posted article object", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(201);
    expect(res.body.article).toMatchObject({
      article_id: expect.any(Number),
      title: "My New Article",
      body: "Text of the new article...",
      votes: 0,
      topic: "cats",
      created_at: expect.any(String),
      author: "lurker",
      comment_count: 0,
    });
  });

  test("201: ignores any extra properties included in request body", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
        extra_key: "ignore me",
      })
      .expect(201);
    expect(res.body.article).not.toHaveProperty("extra_key");
  });

  test("201: article is added to the database", async () => {
    await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(201);
    const allArticles = await request(app)
      .get("/api/articles?limit=20")
      .expect(200);
    expect(allArticles.body.articles.length).toBe(13);
    const newArticle = allArticles.body.articles.filter((article) => {
      return (
        article.author === "lurker" &&
        article.title === "My New Article" &&
        article.topic === "cats"
      );
    });
    expect(newArticle.length).toBe(1);
    const fullArticle = await request(app)
      .get(`/api/articles/${newArticle[0].article_id}`)
      .expect(200);
    expect(fullArticle.body.article).toMatchObject({
      article_id: expect.any(Number),
      title: "My New Article",
      body: "Text of the new article...",
      votes: 0,
      topic: "cats",
      created_at: expect.any(String),
      author: "lurker",
      comment_count: 0,
    });
  });

  test("404: returns User not found when invalid author username passed in", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "not_a_user",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(404);
    expect(res.body.msg).toBe("User not found");
  });

  test("400: returns bad request when request object is missing properties", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });

  test("400: returns bad request when title exceeds character limit", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: createStringOfLength(101),
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });
});

describe("DELETE /api/articles/:article_id", () => {
  test("204: responds with no content when an existing article is deleted ", async () => {
    const res = await request(app).delete("/api/articles/1").expect(204);
    expect(res.text).toBe("");
  });

  test("204: article is deleted from database", async () => {
    const allArticles = await request(app)
      .get("/api/articles?limit=20")
      .expect(200);
    expect(allArticles.body.articles.length).toBe(12);

    await request(app).delete("/api/articles/1").expect(204);
    const remainingArticles = await request(app)
      .get("/api/articles?limit=20")
      .expect(200);
    expect(remainingArticles.body.articles.length).toBe(11);

    const remainingArticleIds = remainingArticles.body.articles.filter(
      (article) => {
        return (article.article_id = 1);
      }
    );
    expect(remainingArticleIds.includes(1)).toBe(false);
  });

  test("404: returns Article not found message when passed a valid but non-existent article id", async () => {
    const res = await request(app).delete("/api/articles/50").expect(404);
    expect(res.body.msg).toBe("Article not found");
  });

  test("400: returns Bad request message when passed an invalid article id", async () => {
    const res = await request(app)
      .delete("/api/articles/not_a_valid_id")
      .expect(400);
    expect(res.body.msg).toBe("Bad request");
  });
});

describe("GET /api/articles/breaking-news", () => {
  test("200: returns an object with a breaking_news property that contains an array of article objects ", async () => {
    await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(201);
    const res = await request(app)
      .get("/api/articles/breaking-news")
      .expect(200);
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body.breaking_news)).toBe(true);
    expect(res.body.breaking_news[0]).toMatchObject({
      article_id: expect.any(Number),
      title: "My New Article",
    });
  });
  test("200: breaking_news array is empty when no new news articles in the past day are posted ", async () => {
    const res = await request(app)
      .get("/api/articles/breaking-news")
      .expect(200);
    expect(res.body.breaking_news.length).toBe(0);
  });
  test("200: returns multiple articles, with article_id and title properties, in the breaking_news array when multiple news articles are posted within the last day", async () => {
    await request(app)
      .post("/api/articles")
      .send({
        author: "lurker",
        title: "My New Article",
        body: "Text of the new article...",
        topic: "cats",
      })
      .expect(201);
    await request(app)
      .post("/api/articles")
      .send({
        author: "rogersop",
        title: "Another New Article",
        body: "More text ...",
        topic: "paper",
      })
      .expect(201);
    const res = await request(app)
      .get("/api/articles/breaking-news")
      .expect(200);
    expect(res.body.breaking_news.length).toBe(2);
    res.body.breaking_news.forEach((article) => {
      expect(Object.keys(article).length).toBe(2);
      expect(article).toMatchObject({
        article_id: expect.any(Number),
        title: expect.any(String),
      });
    });
  });
});
