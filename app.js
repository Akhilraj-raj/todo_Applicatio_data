const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

const validateDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
validateDBAndServer();

const dbToRes = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const format = require("date-fns/format");

const isMatch = require("date-fns/isMatch");

var isValid = require("date-fns/isValid");

let validateStatus = (status) => {
  return status === `TO DO` || status === `IN PROGRESS` || status === `DONE`;
};

let validatePriority = (priority) => {
  return priority === `HIGH` || priority === `MEDIUM` || priority === `LOW`;
};

let validateCategory = (category) => {
  return category === `WORK` || category === `HOME` || category === `LEARNING`;
};

let hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

let hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

let hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

let hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

let hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

let hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

let hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (validateStatus(status) && validatePriority(priority)) {
        getTodoQuery = `
                SELECT * FROM todo WHERE status ='${status}' AND priority = '${priority}';`;
      } else {
        response.status(400);
        if (validateStatus(status)) {
          response.send("Invalid Todo Priority");
        } else {
          response.send("Invalid Todo Status");
        }
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (validateCategory(category) && validatePriority(priority)) {
        getTodoQuery = ` SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
      } else {
        if (validateCategory(category)) {
          response.status(400);
          response.send("Invalid Todo Priority");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (validateCategory(category) && validateStatus(status)) {
        getTodoQuery = `
            SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';
            `;
      } else {
        if (validateCategory(category)) {
          response.status(400);
          response.send("Invalid Todo Category");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }
      break;
    case hasStatus(request.query):
      if (validateStatus(status)) {
        getTodoQuery = `
            SELECT * FROM todo WHERE status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (validatePriority(priority)) {
        getTodoQuery = `
            SELECT * FROM todo WHERE priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasSearch(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case hasCategory(request.query):
      if (validateCategory(category)) {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
  data = await db.all(getTodoQuery);
  response.send(data.map((eachObj) => dbToRes(eachObj)));
});

// api 2 get todo based on id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = ` SELECT * FROM todo WHERE id=${todoId};`;
  const todoItem = await db.get(getTodo);
  response.send(dbToRes(todoItem));
});

// API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const dbResponse = await db.all(getDateQuery);

    response.send(dbResponse.map((eachItem) => dbToRes(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// api 6 delete

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
