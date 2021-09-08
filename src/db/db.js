const _create = require("./create.js");
const _delete = require("./delete.js");
const _get = require("./get.js");
const _list = require("./list.js");
const _update = require("./update.js");

module.exports = {
  create: _create.create,
  delete: _delete.delete,
  get: _get.get,
  list: _list.list,
  update: _update.update
};
