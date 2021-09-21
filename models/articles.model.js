const db = require("../db/connection.js");

exports.fetchArticleById = async (article_id) => {
  const result = await db.query(
    `SELECT articles.author, title, articles.article_id, articles.body, topic, articles.created_at, articles.votes, COUNT(comment_id) AS comment_count FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id WHERE articles.article_id = $1 GROUP BY articles.article_id;`,
    [article_id]
  );
  const article = result.rows[0];
  article.comment_count = parseInt(article.comment_count);
  return article;
};
