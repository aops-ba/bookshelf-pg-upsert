const _ = require("lodash");

module.exports = bookshelf => {
  bookshelf.Model = bookshelf.Model.extend({
    upsert(updateAttributes) {
      const knex = bookshelf.knex;
      // constraints are the current model's attributes
      // updateAttributes are what we want to change if they already exist
      const queryAttributes = {};
      this._knex._statements.forEach(c => {
        console.log(c.operator, c.column, c.value);
        if (c.operator === "=") {
          queryAttributes[c.column] = c.value;
        }
      });
      // surround constraints with double quotes
      const constraints = Object.keys(queryAttributes).map(c => `"${c}"`);

      // no constraints, ruh roh
      if (!constraints.length) {

      }

      console.log(queryAttributes);
      console.log(updateAttributes);
      const insert = knex(this.tableName).insert(_.extend({}, queryAttributes, updateAttributes));
      const update = knex().update(updateAttributes);
      console.log(constraints.join(","));

      return knex.raw(`? ON CONFLICT (${constraints.join(",")}) DO ? RETURNING *`, [insert, update])
      .then(x => console.log(x))
      .catch(e => console.log(e));
    },
    safeInsert(attributes) {
      const knex = bookshelf.knex;
      const insert = knex(this.tableName).insert(attributes);
      return bookshelf.knex.raw("? ON CONFLICT DO NOTHING RETURNING *", [insert]);
    },
  })
}
