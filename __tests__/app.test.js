const db = require("../db/connection.js");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app.js");
const request = require("supertest");
const { toBeSortedBy } = require("jest-sorted");
const { createStringOfLength } = require("../db/utils/data-manipulation");

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe("invalid url", () => {
  test("404: returns an invalid url message when passed an endpoint that doesn't exist", async () => {
    const res = await request(app).get("/api/invalidUrl").expect(404);
    expect(res.body.msg).toBe("Invalid URL");
  });
});

describe("GET /api/topics", () => {
  test("200: returns an array of objects", async () => {
    const res = await request(app).get("/api/topics").expect(200);
    expect(Array.isArray(res.body.topics)).toBe(true);
    expect(typeof res.body.topics[0]).toBe("object");
  });
  test("200: returns an array of correct length", async () => {
    const res = await request(app).get("/api/topics").expect(200);
    expect(res.body.topics.length).toBe(3);
  });
  test("200: returns an array of objects containing the correct keys and correct value data types", async () => {
    const res = await request(app).get("/api/topics").expect(200);
    expect(res.body.topics.length).toBeGreaterThanOrEqual(1);
    res.body.topics.forEach((student) => {
      expect(student).toMatchObject({
        slug: expect.any(String),
        description: expect.any(String),
      });
    });
  });
  test("200: returns an array containing the expected topics", async () => {
    const res = await request(app).get("/api/topics").expect(200);
    expect(res.body.topics[0]).toEqual({
      slug: "mitch",
      description: "The man, the Mitch, the legend",
    });
  });
});

describe("GET /api/articles/:article_id", () => {
  test("200: return a single object", async () => {
    const res = await request(app).get("/api/articles/2").expect(200);
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body)).toBe(false);
  });
  test("200: object returned has correct keys and correct value data types", async () => {
    const res = await request(app).get("/api/articles/1").expect(200);
    expect(res.body).toMatchObject({
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
    expect(res.body).toEqual({
      author: "butter_bridge",
      title: "Living in the shadow of a great man",
      article_id: 1,
      body: "I find this existence challenging",
      topic: "mitch",
      created_at: "2020-07-09T20:11:00.000Z",
      votes: 100,
      comment_count: 13,
    });
  });
  test("200: returns an object with comment_count property of 0 when an article does not have any associated comments", async () => {
    const res = await request(app).get("/api/articles/4").expect(200);
    expect(res.body).toEqual({
      author: "rogersop",
      title: "Student SUES Mitch!",
      article_id: 4,
      body: "We all love Mitch and his wonderful, unique typing style. However, the volume of his typing has ALLEGEDLY burst another students eardrums, and they are now suing for damages",
      topic: "mitch",
      created_at: "2020-05-06T01:14:00.000Z",
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
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body)).toBe(false);
  });
  test("200: object returned has correct keys and correct value data types", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200);
    expect(res.body).toMatchObject({
      article_id: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
      votes: expect.any(Number),
      topic: expect.any(String),
      author: expect.any(String),
      created_at: expect.any(String),
    });
  });
  test("200: object returned has count property increased when passed a inc_votes value of >= 1", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(200);
    expect(res.body.votes).toBe(101);
  });
  test("200: object returned has count property decreased when passed a inc_votes value of < 0", async () => {
    const res = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: -40 })
      .expect(200);
    expect(res.body.votes).toBe(60);
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
  test("400: when passed an invalid inc_votes parameter", async () => {
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
    const res3 = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1, another_property: "this is not permitted" })
      .expect(400);
    expect(res3.body.msg).toBe("Bad request");
  });
});

describe("GET /api/articles", () => {
  test("200: returns an array of article objects", async () => {
    const res = await request(app).get("/api/articles").expect(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(typeof res.body.articles[0]).toBe("object");
    expect(res.body.articles[0]).toMatchObject({
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
  test("200: returned object has expected comment_count value", async () => {
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
    const res = await request(app).get("/api/articles").expect(200);
    expect(res.body.articles.length).toBe(12);
  });
  test("200: returns only the articles associated with the specified topic when topic is passed in as a parameter", async () => {
    const res = await request(app).get("/api/articles?topic=cats").expect(200);
    expect(res.body.articles.length).toBe(1);
    expect(res.body.articles[0].topic).toBe("cats");
  });
  test("200: returns an empty array when a valid topic is passed in but has no associated articles", async () => {
    const res = await request(app).get("/api/articles?topic=paper").expect(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articles.length).toBe(0);
  });
  test("200: all articles are returned when no author parameter is specified", async () => {
    const res = await request(app).get("/api/articles").expect(200);
    expect(res.body.articles.length).toBe(12);
  });
  test("200: returns only the articles associated with a specified author when author is passed in as a parameter", async () => {
    const res = await request(app)
      .get("/api/articles?author=rogersop")
      .expect(200);
    expect(res.body.articles.length).toBe(3);
    expect(res.body.articles[0].author).toBe("rogersop");
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
      .get("/api/articles?author=rogersop&topic=cats")
      .expect(200);
    expect(res.body.articles.length).toBe(1);
    expect(res.body.articles[0].author).toBe("rogersop");
    expect(res.body.articles[0].topic).toBe("cats");
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
  test("200: returns an array of all comment objects associated with the specified article", async () => {
    const res = await request(app).get("/api/articles/1/comments").expect(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBe(13);
    expect(typeof res.body.comments[0]).toBe("object");
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
});

describe("POST /api/articles/:article_id/comments", () => {
  test("returns a single object", async () => {
    const res = await request(app)
      .post("/api/articles/3/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(200);
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body)).toBe(false);
  });
  test("returned object has the correct keys and correct value data types", async () => {
    const res = await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(200);
    expect(res.body).toMatchObject({
      comment_id: expect.any(Number),
      votes: expect.any(Number),
      created_at: expect.any(String),
      author: expect.any(String),
      body: expect.any(String),
    });
  });
  test("returns the correct comment object", async () => {
    const res = await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker", body: "Living his best pug life" })
      .expect(200);
    expect(res.body).toMatchObject({
      comment_id: expect.any(Number),
      votes: 0,
      created_at: expect.any(String),
      author: "lurker",
      body: "Living his best pug life",
    });
  });
  test("comment is added to the database", async () => {
    await request(app)
      .post("/api/articles/1/comments")
      .send({ username: "lurker", body: "Living his best pug life" });
    const res = await request(app).get("/api/articles/1/comments").expect(200);
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

describe("GET /api", () => {
  test("200: responds with an object", async () => {
    const res = await request(app).get("/api").expect(200);
    expect(typeof res.body).toBe("object");
  });
  test("200: returned object contains all available endpoints", async () => {
    const res = await request(app).get("/api").expect(200);
    const returnedEndpoints = Object.keys(res.body);
    const availableEndpoints = [
      "GET /api",
      "GET /api/topics",
      "GET /api/articles",
      "GET /api/articles/:article_id",
      "PATCH /api/articles/:article_id",
      "GET /api/articles/:article_id/comments",
      "POST /api/articles/:article_id/comments",
    ];
    expect(returnedEndpoints.length).toBe(7);
    availableEndpoints.forEach((endpoint) => {
      expect(returnedEndpoints.includes(endpoint)).toBe(true);
    });
  });
});

describe("DELETE /api/comments/:comment_id", () => {
  test("204: responds with no content when an existing comment is deleted ", async () => {
    const res = await request(app).delete("/api/comments/1").expect(204);
    expect(res.text).toBe("");
  });
  test("204: comment is deleted from database", async () => {
    const commentsResponse = await request(app)
      .get("/api/articles/1/comments")
      .expect(200);
    const commentId = commentsResponse.body.comments[0].comment_id;
    const commentAmount = commentsResponse.body.comments.length;
    await request(app).delete(`/api/comments/${commentId}`).expect(204);
    const newCommentsResponse = await request(app)
      .get("/api/articles/1/comments")
      .expect(200);
    expect(newCommentsResponse.body.comments.length).toBe(commentAmount - 1);
    const remainingCommentIds = newCommentsResponse.body.comments.map(
      (comment) => {
        return comment.comment_id;
      }
    );
    expect(remainingCommentIds.includes(commentId)).toBe(false);
  });
});
