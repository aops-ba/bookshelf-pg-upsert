const _ = require("lodash");

module.exports = bookshelf => {
  bookshelf.Model = bookshelf.Model.extend({

    upsert(updateAttributes, constraint) {
      const knex = bookshelf.knex;
      // 'constraint' is the current model's attached constraint
      // updateAttributes are what we want to change if they already exist
      const queryAttributes = {};

      this._knex._statements.forEach(c => {
        if (c.operator === "=") {
          queryAttributes[c.column] = c.value;
        } else if (c.type === "whereNull") {
          queryAttributes[c.column] = null;
        } else {
          throw new Error(`Invalid operator on "${c.column}" for upsertion`);
        }
      });

      const insertionObject = _.extend({}, queryAttributes, updateAttributes);

      constraint = constraint || this.constraint || [];
      constraint = constraint.map(c => `"${c}"`);

      // if there aren't any constraints on the model, let's try to find something that matches
      if (constraint.length) {
        const insert = knex(this.tableName).insert(insertionObject);
        const update = knex().queryBuilder().update(updateAttributes);

        return knex.raw(`? ON CONFLICT (${constraint.join(",")}) DO ? RETURNING *`, [insert, update])
        .then(result => result[0].rows);
      } else {
        throw new Error("No constraints on this model");
      }
    },

    safeInsert(attributes) {
      const knex = bookshelf.knex;
      const insert = knex(this.tableName).insert(attributes);
      return bookshelf.knex.raw("? ON CONFLICT DO NOTHING RETURNING *", [insert])
      .then(result => result[0].rows);
    },
  });
}
